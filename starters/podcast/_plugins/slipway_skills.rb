# frozen_string_literal: true

# Slipway podcast starter: publishes the agent-skills index and the skills it points at.
#
# The files live in .well-known/agent-skills/ in the source folder and are copied to the built site
# as they are. Jekyll leaves a folder whose name starts with a dot out of the build, and a Markdown
# file with front matter would be rendered as HTML instead of copied, so this plugin writes them.
#
# The theme will publish the index itself once `theme.agent-skills-index` lands. Until then, this
# plugin keeps the site at agent-editable L3.

if defined?(Jekyll::Generator)
  module Slipway
    module Skills
      # The folder, in the source and in the built site.
      DIR = ".well-known/agent-skills"

      class Generator < ::Jekyll::Generator
        safe false
        priority :lowest

        def generate(site)
          root = File.join(site.source, DIR)
          return unless File.directory?(root)

          Dir.glob(File.join(root, "**", "*")).sort.each do |path|
            next unless File.file?(path)

            relative = path.sub("#{site.source}/", "")
            site.static_files << ::Jekyll::StaticFile.new(site, site.source, File.dirname(relative), File.basename(relative))
          end
        end
      end
    end
  end
end
