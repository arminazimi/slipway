{{- /* A page's Markdown twin: its title as a heading, then its Markdown as written, without front matter. */ -}}
# {{ .Title }}
{{ with .RawContent }}
{{ trim . " \n\r\t" }}
{{ end -}}
