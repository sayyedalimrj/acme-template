# Packaging the WordPress plugin for install

WordPress only accepts a plugin when **one** PHP file at the **root of the plugin folder** contains a valid header comment block.

## Build the distributable zip (recommended)

From the repository root:

```bash
./scripts/package-plugin.sh
```

Output (gitignored):

`wordpress-plugin/build/wordpress-commerce-os-companion-<version>.zip`

Inside the zip:

```
wordpress-commerce-os-companion/
  wordpress-commerce-os-companion.php
  includes/
  assets/
  uninstall.php
  README.md
  SECURITY.md
```

The script **excludes** `examples/`, `src/`, and tooling files so WordPress never sees a second fake plugin header.

## Manual install (development)

Copy or symlink only the runtime files into:

`wp-content/plugins/wordpress-commerce-os-companion/`

Do **not** copy `examples/` or `src/` into that folder.

## Verify before upload

```bash
./scripts/package-plugin.sh
unzip -l wordpress-plugin/build/wordpress-commerce-os-companion-*.zip | head
php -l wordpress-plugin/wordpress-commerce-os-companion.php
```

You should see exactly **one** `Plugin Name:` entry in the packaged tree (the main bootstrap file).

## If WordPress shows “invalid plugin header”

- Confirm the zip contains folder `wordpress-commerce-os-companion/` with `wordpress-commerce-os-companion.php` directly inside it.
- Do not zip the repository folder name `wordpress-plugin/` unless you rename it to `wordpress-commerce-os-companion/` first.
- Do not upload `examples/*.php` — use the markdown example only.
- Re-run `./scripts/package-plugin.sh` and upload the fresh build artifact.
