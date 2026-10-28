# doctor.nav-targets

Check: every `_data/navigation.yml` entry points at a page that exists.

## Why

Agents add navigation items by hand. Each `url` must resolve to a built page, respecting `baseurl`.

## How to fix

Ensure that the URL resolves to a built page in your `_data/navigation.yml` file.

**Bad:**
```yaml
main:
  - title: Broken
    url: /broken.html
```

**Good:**
```yaml
main:
  - title: Home
    url: /
```
