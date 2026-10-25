# frozen_string_literal: true

# Level 1 of ADR 0007: the source map of a classic-Pages site, computed outside a build with the code
# of the Actions plugin. Prints the JSON; tools/sourcemap/run.mjs writes or checks the committed file.
# Usage: bundle exec ruby tools/sourcemap/sourcemap.rb <site source folder>
require "jekyll"
require_relative "../../_plugins/slipway_sourcemap"

unless Kramdown::VERSION == Slipway::Sourcemap::KRAMDOWN_VERSION
  abort "sourcemap: kramdown #{Kramdown::VERSION}, but GitHub Pages runs #{Slipway::Sourcemap::KRAMDOWN_VERSION}; run it with the github-pages gem (bundle exec)"
end

source = File.expand_path(ARGV.fetch(0, "."))
config = Jekyll.configuration("source" => source, "destination" => File.join(source, "_site"), "quiet" => true)
site = Jekyll::Site.new(config)
site.reset
site.read
print Slipway::Sourcemap.to_json(Slipway::Sourcemap.build(site))
