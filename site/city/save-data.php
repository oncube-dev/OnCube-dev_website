<?php
/**
 * Скрипт для сохранения данных города в JSON файл
 * Разместите этот файл в папке site/city/ на сервере
 */

// Разрешаем запросы с любого домена (можно ограничить для безопасности)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Разрешаем только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Только POST запросы разрешены']);
    exit;
}

// Получаем данные из запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Проверяем, что данные валидны
if (!$data || !isset($data['buildings']) || !isset($data['lastSubscriberCount'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Неверный формат данных']);
    exit;
}

// Убеждаемся, что версия присутствует
if (!isset($data['version'])) {
    $data['version'] = 1; // Версия по умолчанию для старых данных
}

// Путь к файлу данных (относительно этого скрипта)
$filePath = '../resources/city-data.json';

// Проверяем, существует ли директория
$dir = dirname($filePath);
if (!is_dir($dir)) {
    // Пытаемся создать директорию
    if (!mkdir($dir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Не удалось создать директорию']);
        exit;
    }
}

// Добавляем время обновления
$data['lastUpdate'] = date('c'); // ISO 8601 формат

// Записываем данные в файл
$result = file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Не удалось записать файл']);
    exit;
}

// Устанавливаем права на файл (чтение для всех, запись для владельца)
chmod($filePath, 0644);

// Возвращаем успешный ответ
echo json_encode([
    'success' => true,
    'message' => 'Данные успешно сохранены',
    'buildingsCount' => count($data['buildings']),
    'subscriberCount' => $data['lastSubscriberCount'],
    'lastUpdate' => $data['lastUpdate']
]);
?>

