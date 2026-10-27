require 'yaml'
data = YAML.load_file('_data/i18n/de.yml')
puts "de.yml not_found_text: " + data['not_found_text'].inspect
