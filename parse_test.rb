require 'yaml'

puts "Ruby version: #{RUBY_VERSION}"

files = Dir.glob("_data/i18n/*.yml")
files.each do |f|
  begin
    data = YAML.load_file(f)
    puts "#{f}: OK"
  rescue Exception => e
    puts "#{f}: ERROR - #{e.message}"
  end
end
