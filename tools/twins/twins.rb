# frozen_string_literal: true

# Classic-Pages twins (ADR 0006): the stub pages a site needs, computed outside a build with the code
# of the Actions plugin. Prints { "stub path": "stub text" } as JSON; tools/twins/run.mjs writes or
# checks the committed stubs.
# Usage: bundle exec ruby tools/twins/twins.rb <site source folder>
require "jekyll"
require "json"
require_relative "../../_plugins/slipway_twins"

source = File.expand_path(ARGV.fetch(0, "."))
config = Jekyll.configuration("source" => source, "destination" => File.join(source, "_site"), "quiet" => true)
site = Jekyll::Site.new(config)
site.reset
site.read
print JSON.generate(Slipway::Twins.stubs(site))
