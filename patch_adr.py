with open('docs/adr/0012-public-api.md', 'r') as f:
    text = f.read()

comments_keys = """| `slipway.comments.giscus.repo` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.repo_id` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.category` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.category_id` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.mapping` | yes | `comments.test.mjs` |
"""

target = """| `slipway.comments.giscus.repo` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.repo_id` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.category` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.category_id` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.mapping` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.repo` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.repo_id` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.category` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.category_id` | yes | `comments.test.mjs` |
| `slipway.comments.giscus.mapping` | yes | `comments.test.mjs` |
"""

text = text.replace(target, comments_keys)

with open('docs/adr/0012-public-api.md', 'w') as f:
    f.write(text)
