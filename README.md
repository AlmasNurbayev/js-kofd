# js-kofd
Данный бот разработан с целью онлайн отображения информации о суммах продажах/возвратах в сети магазинов Cipo.
Сервис выступает и как пет-проект и как инструмент мониторинга.

Выводится информация:
 - о продажах/возвратах за заданный период времени, используются предустановленные периоды. Источник данных - ОФД Jusan Mobile.  
 - состоянии смен в текущий день
 - служебные данные - лог-файл, файл ошибок в усеченном или полном виде, лог запросов.
            
Используемый стек:
 - node js с модулями - axios (get и post запросы к ОФД jusan Mobile), telegraf (интерфейс бота), pg (обращения к Postgres), moment (даты), pino (логи), chart-js (диаграммы).
 - репозиторий - https://github.com/AlmasNurbayev/js-kofd

Скриншоты:
- Основные команды - они по периодам выводят либо текст, либо диаграммы
<image src="/public_images/bot_commands.png" alt="Основные команды - они по периодам выводят либо текст, либо диаграммы">
- Главная статистика
<image src="/public_images/bot_stat.png" alt="главная статистика">
- Загрузка чека и изображения товара (нужен бэкенд сайта)
<image src="/public_images/bot_check.png" alt="Загрузка чека и изображения товара (нужен бэкенд сайта)">
- Диаграмма
<image src="/public_images/bot_chart.png" alt="Диаграмма">
- Также можно через бот выводить логи, частично или полностью файл
<image src="/public_images/bot_admin_command.png" alt="Также можно через бот выводить логи, частично или полностью файл">


