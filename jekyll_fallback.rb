require 'yaml'
data = YAML.load_file('_data/i18n/de.yml')
puts data['not_found_text']
