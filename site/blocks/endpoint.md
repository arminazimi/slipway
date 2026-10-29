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

<div markdown="0">
<p>LTR example:</p>
{% include blocks/endpoint.html method=page.method path=page.path parameters=page.parameters request=page.request response=page.response %}
</div>

<div dir="rtl" markdown="0">
<p>RTL example:</p>
{% include blocks/endpoint.html method=page.method path=page.path parameters=page.parameters request=page.request response=page.response %}
</div>
