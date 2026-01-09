// Конфигурация
const UPDATE_INTERVAL = 600000; // Обновление каждые 10 минут
const DATA_FILE_PATH = '../resources/city-data.json';
const DATA_VERSION = 7; // Версия формата данных (увеличено для принудительного пересоздания всех зданий)
const BUILDING_SPACING = 3; // Расстояние между зданиями
const GRID_SIZE = 20; // Размер сетки для размещения зданий
const DISTRICT_SIZE = 1000; // Количество подписчиков на один район
const DISTRICT_AREA_SIZE = 32; // Размер области одного района (увеличено для предотвращения пересечений)

// Состояние
let scene, camera, renderer, controls;
let buildings = [];
let currentSubscribers = 0;
let lastSubscriberCount = 0;
let buildingGrid = {}; // Для отслеживания занятых позиций

// Управление камерой (глобальные переменные)
let isPointerLocked = false;
let cameraRotationX = 0; // Вертикальный поворот (pitch)
let cameraRotationY = 0; // Горизонтальный поворот (yaw)
const moveSpeed = 0.3;
const keys = {};

// Типы зданий
const BUILDING_TYPES = {
    MICRO: { 
        name: 'Микродомик', 
        threshold: 10, 
        size: { width: 1, height: 1, depth: 1 },
        color: 0x8B4513 
    },
    HOUSE: { 
        name: 'Домик', 
        threshold: 100, 
        size: { width: 1.5, height: 2, depth: 1.5 },
        color: 0x654321 
    },
    PARK: { 
        name: 'Парк', 
        threshold: 500, 
        size: { width: 5, height: 0.5, depth: 5 },
        color: 0x228B22,
        isPark: true
    }
};

// Инициализация Three.js сцены
function initScene() {
    const container = document.getElementById('canvas-container');
    
    // Сцена
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 50, 200);
    
    // Камера
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    
    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);
    
    // Земля
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Управление камерой в стиле FPS (свободное перемещение)
    // Переменные уже объявлены глобально
    
    // Начальная позиция камеры
    camera.position.set(0, 10, 20);
    camera.rotation.order = 'YXZ';
    // Устанавливаем начальный поворот камеры (горизонтально, смотря на город)
    cameraRotationY = 0; // Смотрим прямо
    cameraRotationX = 0; // Горизонтально, без наклона
    cameraRotationZ = 0;
    // Сбрасываем все повороты камеры
    camera.rotation.set(cameraRotationX, cameraRotationY, cameraRotationZ);
    
    // Отключаем контекстное меню
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Блокировка указателя для управления камерой
    function requestPointerLock() {
        renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock ||
                                                 renderer.domElement.mozRequestPointerLock ||
                                                 renderer.domElement.webkitRequestPointerLock;
        
        if (renderer.domElement.requestPointerLock) {
            renderer.domElement.requestPointerLock();
        }
    }
    
    // Обработка блокировки указателя
    const pointerLockChange = () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement ||
                         document.mozPointerLockElement === renderer.domElement ||
                         document.webkitPointerLockElement === renderer.domElement;
    };
    
    document.addEventListener('pointerlockchange', pointerLockChange);
    document.addEventListener('mozpointerlockchange', pointerLockChange);
    document.addEventListener('webkitpointerlockchange', pointerLockChange);
    
    // Управление мышью (поворот камеры)
    const onMouseMove = (event) => {
        if (!isPointerLocked) return;
        
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        
        cameraRotationY -= movementX * 0.002;
        cameraRotationX -= movementY * 0.002;
        
        // Ограничиваем вертикальный поворот
        cameraRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotationX));
        
        camera.rotation.y = cameraRotationY;
        camera.rotation.x = cameraRotationX;
        camera.rotation.z = 0; // Всегда убираем наклон по оси Z
    };
    
    document.addEventListener('mousemove', onMouseMove);
    
    // Клик для активации управления
    renderer.domElement.addEventListener('click', () => {
        if (!isPointerLocked) {
            requestPointerLock();
        }
    });
    
    // Управление клавиатурой (WASD)
    const onKeyDown = (event) => {
        keys[event.code] = true;
        // Предотвращаем прокрутку страницы при нажатии Space
        if (event.code === 'Space') {
            event.preventDefault();
        }
        // Переключение видимости окна статистики по правому Alt
        if (event.code === 'AltRight') {
            event.preventDefault();
            toggleStatsVisibility();
        }
    };
    
    const onKeyUp = (event) => {
        keys[event.code] = false;
        // Предотвращаем прокрутку страницы при отпускании Space
        if (event.code === 'Space') {
            event.preventDefault();
        }
    };
    
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // Функция переключения видимости окна статистики
    let statsVisible = true;
    function toggleStatsVisibility() {
        const statsContent = document.getElementById('stats-content');
        const hiddenIndicator = document.getElementById('hidden-indicator');
        
        statsVisible = !statsVisible;
        
        if (statsVisible) {
            statsContent.style.display = 'block';
            hiddenIndicator.style.display = 'none';
        } else {
            statsContent.style.display = 'none';
            hiddenIndicator.style.display = 'block';
        }
    }
    
    // Обновление позиции камеры на основе нажатых клавиш
    // Делаем функцию доступной глобально для вызова из animate
    window.updateCameraMovement = () => {
        if (!isPointerLocked) return;
        
        const direction = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        
        // Применяем поворот камеры к направлениям
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY);
        
        // W - вперед, S - назад
        if (keys['KeyW']) {
            direction.add(forward);
        }
        if (keys['KeyS']) {
            direction.sub(forward);
        }
        
        // A - влево, D - вправо
        if (keys['KeyA']) {
            direction.sub(right);
        }
        if (keys['KeyD']) {
            direction.add(right);
        }
        
        // Нормализуем и применяем скорость
        direction.normalize();
        direction.multiplyScalar(moveSpeed);
        
        // Обновляем позицию камеры
        camera.position.add(direction);
        
        // Вертикальное движение: Space - вверх, Shift - вниз
        const verticalSpeed = moveSpeed;
        if (keys['Space']) {
            camera.position.y += verticalSpeed;
        }
        if (keys['ShiftLeft']) {
            camera.position.y -= verticalSpeed;
        }
        
        // Ограничиваем высоту камеры (не ниже земли, не слишком высоко)
        camera.position.y = Math.max(2, Math.min(50, camera.position.y));
    };
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Загрузка данных из JSON файла
async function loadDataFromFile() {
    // Проверяем, открыт ли файл локально (file://) или через сервер (http://)
    const isLocalFile = window.location.protocol === 'file:';
    
    let fileData = null;
    
    if (isLocalFile) {
        // Для локальных файлов используем localStorage как fallback
        console.log('Локальный режим: используем localStorage вместо файла');
        const savedBuildings = localStorage.getItem('cityBuildings');
        const savedSubs = localStorage.getItem('cityLastSubscriberCount');
        const savedUpdate = localStorage.getItem('cityLastUpdate');
        const savedVersion = localStorage.getItem('cityDataVersion');
        
        if (savedBuildings) {
            try {
                const buildingsData = JSON.parse(savedBuildings);
                fileData = {
                    version: savedVersion ? parseInt(savedVersion, 10) : 1,
                    buildings: buildingsData,
                    lastSubscriberCount: savedSubs ? parseInt(savedSubs, 10) : 0,
                    lastUpdate: savedUpdate || null
                };
            } catch (e) {
                console.error('Ошибка парсинга данных из localStorage:', e);
            }
        }
    } else {
        // Для сервера пытаемся загрузить из файла
        try {
            const response = await fetch(DATA_FILE_PATH);
            if (response.ok) {
                fileData = await response.json();
            }
        } catch (e) {
            console.error('Ошибка загрузки данных из файла:', e);
        }
    }
    
    // Проверяем версию данных
    if (fileData && fileData.version !== DATA_VERSION) {
        console.log(`Версия данных (${fileData.version || 1}) не совпадает с текущей (${DATA_VERSION}). Пересоздаем здания.`);
        // Возвращаем пустые данные, чтобы здания пересоздались
        return { 
            version: DATA_VERSION,
            buildings: [], 
            lastSubscriberCount: fileData.lastSubscriberCount || 0, 
            lastUpdate: null 
        };
    }
    
    if (fileData) {
        const buildingsCount = fileData.buildings ? fileData.buildings.length : 0;
        const subsCount = fileData.lastSubscriberCount || 0;
        console.log('Загружено из файла:', buildingsCount, 'зданий, подписчиков:', subsCount);
        return fileData;
    }
    
    return { 
        version: DATA_VERSION,
        buildings: [], 
        lastSubscriberCount: 0, 
        lastUpdate: null 
    };
}

// Подготовка данных для сохранения в файл
function prepareDataForSave() {
    const buildingsData = buildings.map(building => ({
        type: building.userData.type,
        position: {
            x: building.position.x,
            y: building.position.y,
            z: building.position.z
        },
        districtNumber: building.userData.districtNumber
    }));
    
    return {
        version: DATA_VERSION,
        buildings: buildingsData,
        lastSubscriberCount: currentSubscribers,
        lastUpdate: new Date().toISOString()
    };
}

// Сохранение данных на сервер через PHP-скрипт
async function saveData() {
    const data = prepareDataForSave();
    
    // Сохраняем в localStorage как резервную копию
    localStorage.setItem('cityBuildings', JSON.stringify(data.buildings));
    localStorage.setItem('cityLastSubscriberCount', data.lastSubscriberCount.toString());
    localStorage.setItem('cityLastUpdate', data.lastUpdate);
    localStorage.setItem('cityDataVersion', DATA_VERSION.toString());
    
    // Отправляем данные на сервер через PHP-скрипт
    try {
        const response = await fetch('save-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            console.log('Данные успешно сохранены на сервер:', result);
        } else {
            console.error('Ошибка сохранения:', result.error);
        }
    } catch (error) {
        console.error('Ошибка при сохранении данных на сервер:', error);
        console.log('Данные сохранены в localStorage как резервная копия');
        // Выводим данные в консоль для ручного копирования
        console.log('Данные для ручного сохранения:');
        console.log(JSON.stringify(data, null, 2));
    }
}

// Скачивание файла данных для ручного обновления на сервере
function downloadDataFile(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'city-data.json';
    a.style.display = 'none';
    document.body.appendChild(a);
    // Не скачиваем автоматически, только при необходимости
    // a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Восстановление здания из сохраненных данных
function restoreBuilding(buildingData) {
    const buildingType = BUILDING_TYPES[buildingData.type];
    if (!buildingType) return null;
    
    const geometry = new THREE.BoxGeometry(
        buildingType.size.width,
        buildingType.size.height,
        buildingType.size.depth
    );
    
    const material = new THREE.MeshStandardMaterial({ 
        color: buildingType.color,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.set(
        buildingData.position.x,
        buildingData.position.y,
        buildingData.position.z
    );
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData = { 
        type: buildingData.type, 
        buildingType,
        districtNumber: buildingData.districtNumber 
    };
    
    // Для парков добавляем зеленую траву
    if (buildingType.isPark) {
        const grassGeometry = new THREE.PlaneGeometry(
            buildingType.size.width,
            buildingType.size.depth
        );
        const grassMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x32CD32,
            roughness: 1,
            metalness: 0
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = 0.01;
        building.add(grass);
    }
    
    // Для восстановленных зданий не нужна анимация появления
    building.scale.set(1, 1, 1);
    
    scene.add(building);
    buildings.push(building);
    
    return building;
}

// Создание здания
function createBuilding(type, position) {
    const buildingType = BUILDING_TYPES[type];
    if (!buildingType) return null;
    
    const geometry = new THREE.BoxGeometry(
        buildingType.size.width,
        buildingType.size.height,
        buildingType.size.depth
    );
    
    const material = new THREE.MeshStandardMaterial({ 
        color: buildingType.color,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.set(position.x, buildingType.size.height / 2, position.z);
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData = { type, buildingType, districtNumber: position.districtNumber };
    
    // Для парков добавляем зеленую траву
    if (buildingType.isPark) {
        const grassGeometry = new THREE.PlaneGeometry(
            buildingType.size.width,
            buildingType.size.depth
        );
        const grassMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x32CD32,
            roughness: 1,
            metalness: 0
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = 0.01;
        building.add(grass);
    }
    
    // Анимация появления
    building.scale.set(0, 0, 0);
    const scaleAnimation = { scale: 0 };
    const targetScale = 1;
    
    const animate = () => {
        scaleAnimation.scale += 0.05;
        if (scaleAnimation.scale < targetScale) {
            building.scale.set(
                scaleAnimation.scale,
                scaleAnimation.scale,
                scaleAnimation.scale
            );
            requestAnimationFrame(animate);
        } else {
            building.scale.set(1, 1, 1);
        }
    };
    animate();
    
    scene.add(building);
    buildings.push(building);
    
    // Сохраняем данные (в localStorage и готовим для файла)
    saveData();
    
    return building;
}

// Проверка коллизии между двумя прямоугольниками
function checkCollision(pos1, size1, pos2, size2, minGap = 0.1) {
    const halfWidth1 = size1.width / 2 + minGap;
    const halfDepth1 = size1.depth / 2 + minGap;
    const halfWidth2 = size2.width / 2 + minGap;
    const halfDepth2 = size2.depth / 2 + minGap;
    
    // Проверяем пересечение по оси X
    const overlapX = Math.abs(pos1.x - pos2.x) < (halfWidth1 + halfWidth2);
    // Проверяем пересечение по оси Z
    const overlapZ = Math.abs(pos1.z - pos2.z) < (halfDepth1 + halfDepth2);
    
    // Коллизия есть, если пересекаются по обеим осям
    return overlapX && overlapZ;
}

// Получение номера текущего района на основе количества подписчиков
function getCurrentDistrict(subscriberCount) {
    return Math.floor(subscriberCount / DISTRICT_SIZE);
}

// Получение границ района (позиция и размер области)
function getDistrictBounds(districtNumber) {
    // Располагаем районы в сетке 4x4 (16 районов максимум)
    const districtsPerRow = 4;
    const districtRow = Math.floor(districtNumber / districtsPerRow);
    const districtCol = districtNumber % districtsPerRow;
    
    // Центр области района
    const centerX = (districtCol - 1.5) * DISTRICT_AREA_SIZE;
    const centerZ = (districtRow - 1.5) * DISTRICT_AREA_SIZE;
    
    return {
        centerX,
        centerZ,
        size: DISTRICT_AREA_SIZE
    };
}

// Улучшенный детерминированный генератор псевдослучайных чисел (seed-based)
// Используем Mulberry32 алгоритм для лучшего распределения
function seededRandom(seed) {
    // Mulberry32 - качественный PRNG с хорошим распределением
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Поиск свободной позиции с проверкой коллизий в пределах района (детерминированный)
function findFreePosition(buildingType, districtNumber, buildingIndex) {
    const minGap = 0.35; // Минимальный зазор между зданиями
    
    // Получаем границы текущего района
    const districtBounds = getDistrictBounds(districtNumber);
    const halfSize = districtBounds.size / 2;
    
    // Получаем здания только текущего района
    const districtBuildings = buildings.filter(b => {
        const buildingDistrict = b.userData.districtNumber;
        return buildingDistrict === districtNumber;
    });
    
    // Используем максимально сложный детерминированный seed для максимального разнообразия
    // Добавляем множество факторов для первых зданий, чтобы они не были упорядочены
    const typeHash = buildingType.name.charCodeAt(0) + buildingType.size.width * 7 + buildingType.size.depth * 13;
    const buildingTypeCode = buildingType.name === 'MICRO' ? 1 : buildingType.name === 'HOUSE' ? 2 : buildingType.name === 'PARK' ? 3 : 4;
    
    // Используем максимально сложную нелинейную формулу seed с множеством множителей
    // Добавляем максимальную нелинейность через умножение, XOR, сдвиги и модули
    // Используем разные простые числа для каждого компонента
    const baseSeed1 = districtNumber * 7919;
    const baseSeed2 = buildingIndex * 3571;
    const baseSeed3 = (buildingIndex * buildingIndex) * 997;
    const baseSeed4 = (buildingIndex * buildingIndex * buildingIndex) * 1237;
    
    const typeSeed1 = typeHash * 5527;
    const typeSeed2 = buildingTypeCode * 3571;
    const typeSeed3 = (typeHash * buildingTypeCode) * 7919;
    
    // Добавляем нелинейные комбинации с XOR и сдвигами
    const nonLinear1 = (baseSeed1 ^ baseSeed2) << 5;
    const nonLinear2 = (baseSeed3 ^ baseSeed4) >>> 3;
    const nonLinear3 = (typeSeed1 ^ typeSeed2) * typeSeed3;
    const nonLinear4 = (districtNumber << 10) ^ (buildingIndex << 5);
    
    // Комбинируем все компоненты с максимальной нелинейностью
    const combinedSeed = (nonLinear1 ^ nonLinear2) + (nonLinear3 ^ nonLinear4) + 
                         (baseSeed1 * baseSeed2) ^ (typeSeed1 * typeSeed2) +
                         (districtNumber * buildingIndex * 7919 * 3571);
    const seed = Math.abs(combinedSeed) % 2147483647;
    
    // Генерируем детерминированную позицию с максимальной случайностью
    // Используем множество независимых случайных значений для максимально естественного распределения
    // Используем большие смещения в seed для максимальной независимости значений
    const angle1 = seededRandom(seed + 100000) * Math.PI * 2;
    const angle2 = seededRandom(seed + 200000) * Math.PI * 2;
    const angle3 = seededRandom(seed + 300000) * Math.PI * 2;
    const angle4 = seededRandom(seed + 400000) * Math.PI * 2;
    const angle5 = seededRandom(seed + 500000) * Math.PI * 2; // Еще больше углов
    
    const radius1 = seededRandom(seed + 600000);
    const radius2 = seededRandom(seed + 700000);
    const radius3 = seededRandom(seed + 800000);
    const radius4 = seededRandom(seed + 900000);
    const radius5 = seededRandom(seed + 1000000); // Еще больше радиусов
    
    // Комбинируем углы и радиусы с нелинейной комбинацией для максимальной случайности
    // Используем нелинейную комбинацию вместо простого среднего
    const angle = (angle1 * 0.2 + angle2 * 0.2 + angle3 * 0.2 + angle4 * 0.2 + angle5 * 0.2 + 
                   Math.sin(angle1) * 0.1 + Math.cos(angle2) * 0.1) % (Math.PI * 2);
    
    // Используем нелинейную комбинацию радиусов с разными весами
    const weightedRadius = (radius1 * 0.15 + radius2 * 0.15 + radius3 * 0.15 + radius4 * 0.15 + radius5 * 0.15 +
                           Math.sqrt(radius1) * 0.1 + Math.sqrt(radius2) * 0.1 + Math.sqrt(radius3) * 0.1);
    // Используем более агрессивную степенную функцию для максимальной вариативности
    const radius = Math.pow(weightedRadius, 0.5) * halfSize * 0.95; // 95% радиуса с максимально нелинейным распределением
    
    // Добавляем максимально сильные случайные смещения с максимальной вариативностью
    const offsetX1 = (seededRandom(seed + 1100000) - 0.5) * 6.0; // Увеличено до 6.0
    const offsetX2 = (seededRandom(seed + 1200000) - 0.5) * 3.0;
    const offsetX3 = (seededRandom(seed + 1300000) - 0.5) * 1.5;
    const offsetZ1 = (seededRandom(seed + 1400000) - 0.5) * 6.0; // Увеличено до 6.0
    const offsetZ2 = (seededRandom(seed + 1500000) - 0.5) * 3.0;
    const offsetZ3 = (seededRandom(seed + 1600000) - 0.5) * 1.5;
    
    // Комбинируем смещения нелинейно для максимального разнообразия
    const offsetX = offsetX1 + offsetX2 * Math.sin(offsetX3) + offsetX3;
    const offsetZ = offsetZ1 + offsetZ2 * Math.cos(offsetZ3) + offsetZ3;
    
    const x = districtBounds.centerX + Math.cos(angle) * radius + offsetX;
    const z = districtBounds.centerZ + Math.sin(angle) * radius + offsetZ;
    const position = { x, z };
    
    // Проверяем коллизию только со зданиями текущего района
    let hasCollision = false;
    for (let i = 0; i < districtBuildings.length; i++) {
        const existingBuilding = districtBuildings[i];
        const existingSize = existingBuilding.userData.buildingType.size;
        const existingPos = {
            x: existingBuilding.position.x,
            z: existingBuilding.position.z
        };
        
        if (checkCollision(position, buildingType.size, existingPos, existingSize, minGap)) {
            hasCollision = true;
            break;
        }
    }
    
    // Если есть коллизия, пробуем сместить позицию детерминированно
    if (hasCollision) {
        for (let offset = 1; offset < 30; offset++) {
            // Используем более сложную формулу для нового seed при коллизии
            const newSeed = Math.abs((seed + offset * 3571) ^ (offset * 7919) ^ (offset * offset * 997)) % 2147483647;
            const newAngle1 = seededRandom(newSeed + 100000) * Math.PI * 2;
            const newAngle2 = seededRandom(newSeed + 200000) * Math.PI * 2;
            const newAngle3 = seededRandom(newSeed + 300000) * Math.PI * 2;
            const newAngle4 = seededRandom(newSeed + 400000) * Math.PI * 2;
            const newAngle5 = seededRandom(newSeed + 500000) * Math.PI * 2;
            
            const newRadius1 = seededRandom(newSeed + 600000);
            const newRadius2 = seededRandom(newSeed + 700000);
            const newRadius3 = seededRandom(newSeed + 800000);
            const newRadius4 = seededRandom(newSeed + 900000);
            const newRadius5 = seededRandom(newSeed + 1000000);
            
            const newAngle = (newAngle1 * 0.2 + newAngle2 * 0.2 + newAngle3 * 0.2 + newAngle4 * 0.2 + newAngle5 * 0.2 + 
                             Math.sin(newAngle1) * 0.1 + Math.cos(newAngle2) * 0.1) % (Math.PI * 2);
            const newWeightedRadius = (newRadius1 * 0.15 + newRadius2 * 0.15 + newRadius3 * 0.15 + newRadius4 * 0.15 + newRadius5 * 0.15 +
                                      Math.sqrt(newRadius1) * 0.1 + Math.sqrt(newRadius2) * 0.1 + Math.sqrt(newRadius3) * 0.1);
            const newRadius = Math.pow(newWeightedRadius, 0.5) * halfSize * 0.95;
            
            const newOffsetX1 = (seededRandom(newSeed + 1100000) - 0.5) * 6.0;
            const newOffsetX2 = (seededRandom(newSeed + 1200000) - 0.5) * 3.0;
            const newOffsetX3 = (seededRandom(newSeed + 1300000) - 0.5) * 1.5;
            const newOffsetZ1 = (seededRandom(newSeed + 1400000) - 0.5) * 6.0;
            const newOffsetZ2 = (seededRandom(newSeed + 1500000) - 0.5) * 3.0;
            const newOffsetZ3 = (seededRandom(newSeed + 1600000) - 0.5) * 1.5;
            
            const newOffsetX = newOffsetX1 + newOffsetX2 * Math.sin(newOffsetX3) + newOffsetX3;
            const newOffsetZ = newOffsetZ1 + newOffsetZ2 * Math.cos(newOffsetZ3) + newOffsetZ3;
            
            position.x = districtBounds.centerX + Math.cos(newAngle) * newRadius + newOffsetX;
            position.z = districtBounds.centerZ + Math.sin(newAngle) * newRadius + newOffsetZ;
            
            hasCollision = false;
            for (let i = 0; i < districtBuildings.length; i++) {
                const existingBuilding = districtBuildings[i];
                const existingSize = existingBuilding.userData.buildingType.size;
                const existingPos = {
                    x: existingBuilding.position.x,
                    z: existingBuilding.position.z
                };
                
                if (checkCollision(position, buildingType.size, existingPos, existingSize, minGap)) {
                    hasCollision = true;
                    break;
                }
            }
            
            if (!hasCollision) {
                return position;
            }
        }
    }
    
    // Если все еще есть коллизия, используем систематический поиск
    const step = BUILDING_SPACING * 0.5;
    for (let x = districtBounds.centerX - halfSize; x < districtBounds.centerX + halfSize; x += step) {
        for (let z = districtBounds.centerZ - halfSize; z < districtBounds.centerZ + halfSize; z += step) {
            const testPosition = { x, z };
            let testCollision = false;
            
            for (let i = 0; i < districtBuildings.length; i++) {
                const existingBuilding = districtBuildings[i];
                const existingSize = existingBuilding.userData.buildingType.size;
                const existingPos = {
                    x: existingBuilding.position.x,
                    z: existingBuilding.position.z
                };
                
                if (checkCollision(testPosition, buildingType.size, existingPos, existingSize, minGap)) {
                    testCollision = true;
                    break;
                }
            }
            
            if (!testCollision) {
                return testPosition;
            }
        }
    }
    
    // В крайнем случае возвращаем центр района
    console.warn(`Не удалось найти свободную позицию для здания в районе ${districtNumber}`);
    return {
        x: districtBounds.centerX,
        z: districtBounds.centerZ
    };
}

// Получение количества подписчиков через YouTube API
async function fetchSubscriberCount() {
    try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&id=${CHANNEL_ID}&part=statistics`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('API ключ недействителен или превышен лимит запросов');
            } else {
                throw new Error(`Ошибка запроса к YouTube API: ${response.status}`);
            }
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`YouTube API ошибка: ${data.error.message}`);
        }
        
        if (data.items && data.items[0] && data.items[0].statistics) {
            const subscriberCount = parseInt(data.items[0].statistics.subscriberCount, 10);
            return subscriberCount;
        } else {
            throw new Error('Не удалось получить количество подписчиков');
        }
    } catch (e) {
        console.error('Ошибка YouTube API:', e);
        // Возвращаем последнее известное значение или 0
        return currentSubscribers || 0;
    }
}

// Логика роста города
function updateCity(subscriberCount) {
    // Если подписчики не изменились И здания уже есть, не обновляем
    // НО если зданий нет - создаем их (даже если подписчики не изменились)
    if (subscriberCount === currentSubscribers && buildings.length > 0) {
        return; // Не обновляем, если все уже создано
    }
    
    // Если зданий нет или подписчики изменились - создаем/обновляем здания
    
    // Определяем текущий район (0-999 = район 0, 1000-1999 = район 1, и т.д.)
    const currentDistrict = getCurrentDistrict(subscriberCount);
    
    // Счетчики новых зданий (объявляем вне цикла)
    let totalNewMicroHouses = 0;
    let totalNewHouses = 0;
    let totalNewParks = 0;
    
    // Обрабатываем все районы от 0 до текущего включительно
    for (let districtNum = 0; districtNum <= currentDistrict; districtNum++) {
        const districtStartSubs = districtNum * DISTRICT_SIZE;
        const districtEndSubs = (districtNum + 1) * DISTRICT_SIZE;
        
        // Для текущего района считаем только до текущего количества подписчиков
        // Для предыдущих районов - полный диапазон
        const districtSubs = districtNum === currentDistrict 
            ? Math.min(subscriberCount, districtEndSubs) - districtStartSubs
            : DISTRICT_SIZE;
        
        // Вычисляем сколько зданий должно быть в этом районе
        const targetMicroHouses = Math.floor(districtSubs / BUILDING_TYPES.MICRO.threshold);
        const targetHouses = Math.floor(districtSubs / BUILDING_TYPES.HOUSE.threshold);
        const targetParks = Math.floor(districtSubs / BUILDING_TYPES.PARK.threshold);
        
        // Подсчитываем сколько зданий каждого типа уже есть в этом районе
        const currentMicroHouses = buildings.filter(b => 
            b.userData.type === 'MICRO' && b.userData.districtNumber === districtNum
        ).length;
        const currentHouses = buildings.filter(b => 
            b.userData.type === 'HOUSE' && b.userData.districtNumber === districtNum
        ).length;
        const currentParks = buildings.filter(b => 
            b.userData.type === 'PARK' && b.userData.districtNumber === districtNum
        ).length;
        
        // Вычисляем сколько нужно добавить в этот район
        const newMicroHouses = targetMicroHouses - currentMicroHouses;
        const newHouses = targetHouses - currentHouses;
        const newParks = targetParks - currentParks;
        
        // Создаем список всех зданий, которые нужно построить, чтобы перемешать их
        const buildingsToCreate = [];
        
        // Добавляем микродомики в список
        for (let i = 0; i < newMicroHouses; i++) {
            buildingsToCreate.push({
                type: 'MICRO',
                buildingIndex: currentMicroHouses + i,
                buildingType: BUILDING_TYPES.MICRO
            });
        }
        
        // Добавляем домики в список
        for (let i = 0; i < newHouses; i++) {
            buildingsToCreate.push({
                type: 'HOUSE',
                buildingIndex: currentHouses + i,
                buildingType: BUILDING_TYPES.HOUSE
            });
        }
        
        // Добавляем парки в список
        for (let i = 0; i < newParks; i++) {
            buildingsToCreate.push({
                type: 'PARK',
                buildingIndex: currentParks + i,
                buildingType: BUILDING_TYPES.PARK
            });
        }
        
        // Перемешиваем список детерминированно (Fisher-Yates shuffle с seed)
        if (buildingsToCreate.length > 1) {
            const shuffleSeed = districtNum * 7919 + buildingsToCreate.length * 3571;
            for (let i = buildingsToCreate.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom(shuffleSeed + i * 997) * (i + 1));
                [buildingsToCreate[i], buildingsToCreate[j]] = [buildingsToCreate[j], buildingsToCreate[i]];
            }
        }
        
        // Создаем здания в перемешанном порядке
        for (let i = 0; i < buildingsToCreate.length; i++) {
            const buildingInfo = buildingsToCreate[i];
            // Используем общий индекс для всех зданий в районе (независимо от типа)
            const totalBuildingsInDistrict = buildings.filter(b => 
                b.userData.districtNumber === districtNum
            ).length;
            const position = findFreePosition(buildingInfo.buildingType, districtNum, totalBuildingsInDistrict + i);
            position.districtNumber = districtNum;
            createBuilding(buildingInfo.type, position);
        }
        
        // Суммируем новые здания
        totalNewMicroHouses += newMicroHouses;
        totalNewHouses += newHouses;
        totalNewParks += newParks;
    }
    
    lastSubscriberCount = subscriberCount;
    currentSubscribers = subscriberCount;
    
    // Обновляем счетчик зданий
    document.getElementById('building-count').textContent = buildings.length;
    
    // Сохраняем данные при изменении (если были добавлены новые здания)
    if (totalNewMicroHouses > 0 || totalNewHouses > 0 || totalNewParks > 0) {
        saveData();
    }
}

// Обновление статистики
async function updateStats() {
    const subscriberCount = await fetchSubscriberCount();
    document.getElementById('subscriber-count').textContent = subscriberCount.toLocaleString('ru-RU');
    updateCity(subscriberCount);
}

// Анимационный цикл
function animate() {
    requestAnimationFrame(animate);
    
    // Обновляем движение камеры
    if (window.updateCameraMovement) {
        window.updateCameraMovement();
    }
    
    // Легкое вращение зданий для живости (опционально)
    buildings.forEach((building, index) => {
        if (building.userData.buildingType.isPark) {
            // Парки не вращаем
            return;
        }
        // Очень медленное покачивание
        building.rotation.y = Math.sin(Date.now() * 0.0001 + index) * 0.02;
    });
    
    renderer.render(scene, camera);
}

// Инициализация
async function init() {
    initScene();
    
    // Загружаем данные из файла
    const fileData = await loadDataFromFile();
    
    // Проверяем версию данных - если не совпадает, очищаем все здания
    if (fileData.version !== DATA_VERSION) {
        console.log(`Версия данных (${fileData.version || 1}) не совпадает с текущей (${DATA_VERSION}). Очищаем все здания для пересоздания.`);
        // Удаляем все существующие здания из сцены
        buildings.forEach(building => {
            scene.remove(building);
            if (building.geometry) building.geometry.dispose();
            if (building.material) building.material.dispose();
        });
        buildings = [];
        // Очищаем localStorage
        localStorage.removeItem('cityBuildings');
        localStorage.removeItem('cityLastSubscriberCount');
        localStorage.removeItem('cityLastUpdate');
        localStorage.removeItem('cityDataVersion');
    }
    
    if (fileData.buildings && fileData.buildings.length > 0 && fileData.version === DATA_VERSION) {
        // Восстанавливаем здания из файла только если версия совпадает
        fileData.buildings.forEach(buildingData => {
            restoreBuilding(buildingData);
        });
        // Обновляем счетчик зданий
        document.getElementById('building-count').textContent = buildings.length;
        
        // Устанавливаем последнее известное количество подписчиков
        if (fileData.lastSubscriberCount) {
            lastSubscriberCount = fileData.lastSubscriberCount;
            currentSubscribers = fileData.lastSubscriberCount;
        }
    } else {
        // Если файл пустой, проверяем версию в localStorage
        const savedVersion = localStorage.getItem('cityDataVersion');
        const savedVersionNum = savedVersion ? parseInt(savedVersion, 10) : 1;
        
        // Если версия в localStorage не совпадает с текущей - очищаем localStorage
        if (savedVersionNum !== DATA_VERSION) {
            console.log(`Версия в localStorage (${savedVersionNum}) не совпадает с текущей (${DATA_VERSION}). Очищаем localStorage.`);
            localStorage.removeItem('cityBuildings');
            localStorage.removeItem('cityLastSubscriberCount');
            localStorage.removeItem('cityLastUpdate');
            localStorage.removeItem('cityDataVersion');
        } else {
            // Если версия совпадает, пробуем загрузить из localStorage как резерв
            const savedBuildings = localStorage.getItem('cityBuildings');
            if (savedBuildings) {
                try {
                    const buildingsData = JSON.parse(savedBuildings);
                    if (buildingsData.length > 0) {
                        buildingsData.forEach(buildingData => {
                            restoreBuilding(buildingData);
                        });
                        document.getElementById('building-count').textContent = buildings.length;
                    }
                } catch (e) {
                    console.error('Ошибка загрузки из localStorage:', e);
                }
            }
        }
        
        // Если зданий нет ни в файле, ни в localStorage, сбрасываем счетчики
        // чтобы updateCity создал здания заново
        if (buildings.length === 0) {
            lastSubscriberCount = 0;
            currentSubscribers = 0;
        }
    }
    
    // Загружаем актуальные данные и создаем здания
    console.log('Загружаем актуальные данные...');
    await updateStats();
    console.log('Инициализация завершена. Зданий в сцене:', buildings.length);
    
    // Обновляем каждые 10 минут
    setInterval(updateStats, UPDATE_INTERVAL);
    
    // Запускаем анимацию
    animate();
}

// Запуск при загрузке страницы
window.addEventListener('load', init);

