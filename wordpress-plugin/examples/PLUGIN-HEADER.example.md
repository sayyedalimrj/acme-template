# Example WordPress plugin header (documentation only)

This file is **not** a PHP plugin and must **not** be uploaded to WordPress.

The real installable plugin header lives only in the repository root file:

`wordpress-commerce-os-companion.php`

## Required header fields

```php
/**
 * Plugin Name:       WordPress Commerce OS Companion
 * Description:       ...
 * Version:           1.1.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            JetWeb Commerce OS
 * Text Domain:       wordpress-commerce-os-companion
 */
```

## Common “invalid plugin header” causes

1. Zipping the whole `wordpress-plugin/` repo folder **with** `examples/` or `src/` instead of using `./scripts/package-plugin.sh`.
2. Zipping only a subfolder so the main `.php` file is not at the plugin root.
3. Putting a second PHP file with a `Plugin Name:` comment inside the installable package (WordPress may treat it as another plugin).
4. Uploading the TypeScript contract sources without the main PHP bootstrap file.

## Correct zip layout

```
wordpress-commerce-os-companion/
  wordpress-commerce-os-companion.php   ← required main file with header
  includes/
  assets/
  uninstall.php
```

Build the zip with:

```bash
./scripts/package-plugin.sh
```
