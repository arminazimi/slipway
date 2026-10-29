---
layout: default
title: Endpoint
method: POST
path: /api/v1/users/{id}
parameters:
  - name: id
    type: string
    description: The unique identifier of the user.
    required: true
  - name: role
    type: string
    description: The role to assign to the user.
    required: false
request: |
  {
    "role": "admin"
  }
response: |
  {
    "id": "123",
    "role": "admin",
    "status": "success"
  }
---
# {{ page.title }}

LTR example:

{::nomarkdown}
{% include blocks/endpoint.html method=page.method path=page.path parameters=page.parameters request=page.request response=page.response %}
{:/nomarkdown}

RTL example:

{::nomarkdown}
<div dir="rtl">
{% include blocks/endpoint.html method=page.method path=page.path parameters=page.parameters request=page.request response=page.response %}
</div>
{:/nomarkdown}
