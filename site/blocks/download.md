---
title: Download block
description: A file download with a button, file name, size, and checksum.
layout: page
download:
  url: /assets/images/social.png
  label: Download the image
  name: social.png
  size: 3.1 KB
  checksum: "55780eb2104156d1d883cb3349d72b10ae1fd7c31dc2897e511748841f275b29"
  name_label: File
  size_label: Size
  checksum_label: SHA-256
download_rtl:
  url: /assets/images/social.png
  label: دانلود تصویر
  name: social.png
  size: ۳٫۱ کیلوبایت
  checksum: "55780eb2104156d1d883cb3349d72b10ae1fd7c31dc2897e511748841f275b29"
  name_label: نام فایل
  size_label: حجم
  checksum_label: چک‌سام
---

{::nomarkdown}{% include component-css.html name="download" %}{:/nomarkdown}

## Left-to-right

{% include blocks/download.html url=page.download.url label=page.download.label name=page.download.name size=page.download.size checksum=page.download.checksum name_label=page.download.name_label size_label=page.download.size_label checksum_label=page.download.checksum_label %}

## Right-to-left

<div dir="rtl">
{% include blocks/download.html url=page.download_rtl.url label=page.download_rtl.label name=page.download_rtl.name size=page.download_rtl.size checksum=page.download_rtl.checksum name_label=page.download_rtl.name_label size_label=page.download_rtl.size_label checksum_label=page.download_rtl.checksum_label %}
</div>
