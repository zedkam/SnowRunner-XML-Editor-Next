# Сгенерированный контент новых DLC

Срез выполнен 2026-09-03 из установленного read-only архива:

`D:\SteamLibrary\steamapps\common\SnowRunner\preload\paks\client\initial.pak`

Команда повторной генерации:

```powershell
npm run generate:content -- -ArchivePath "D:\SteamLibrary\steamapps\common\SnowRunner\preload\paks\client\initial.pak"
```

## Defaults

- обработано 495 XML-файлов из `dlc_15_5`–`dlc_18_1`;
- создано 494 ключа defaults;
- один collision ожидаем: `semitrailer_foldable_log.xml` одновременно используется в `trucks/trailers` и `wheels`, а текущий `ImportUtils` идентифицирует файл по имени и source id;
- результат: `src/modules/data/defaults/generated.ts`;
- основной defaults-каталог подключает generated snapshot через spread.

## Изображения

Из XML машин извлечены поля:

- `TruckData @TruckImage` — идентификатор 3D-ресурса;
- `GameData > UiDesc @UiIcon328x458` — идентификатор UI-картинки магазина.

Для 15 машин изображения извлечены из текущего `gfx.pak` из PCT-страниц, на которые
ссылаются символы `trucks_img_lib.gfx`. В [`generated-image-links.json`](generated-image-links.json)
для каждой записи сохранены исходный PCT-файл, номер страницы, способ сопоставления и
путь скопированного файла. Для старой части библиотеки применяется проверенный сдвиг
`raw page - 3`; страницы новой части (`i400+`) берутся напрямую.

Сейчас создано 15 PNG-картинок, `copied=15`, `missing=0`. Для DLC `dlc_18_1`
Mercedes 3850 использует проверенную позднюю страницу `i412`, а Mercedes Mamute
1519 — страницу `i415`. Runtime ищет картинку по
имени XML и по `UiIcon328x458`, поддерживая WebP/PNG/JPEG и fallback. Простые
совпадения по имени файла не считаются источником истины: перед выпуском нужно
проверять `sourceFile`, `texturePage` и визуальный результат.
