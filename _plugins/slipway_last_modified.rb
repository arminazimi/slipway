# frozen_string_literal: true

# Slipway last modified date, Actions mode (issue #452).
#
# Gives every doc page a page.last_modified_at: the date of the last commit that touched its source
# file, so _includes/last-updated.html shows when the page really changed. A front-matter value always
# wins, and a page git knows nothing about (not a repository, no git, or a file not committed yet)
# keeps none and renders nothing. Classic Pages runs no plugins, so there the front-matter value is the
# only source. Not shipped in the gem: themes cannot ship plugins.

require "open3"

module Slipway
  module LastModified
    module_function

    # The committer date of the last commit touching `path` (relative to `source`), as ISO 8601, or nil
    # when git has no answer.
    def from_git(source, path)
      stdout, _stderr, status = Open3.capture3("git", "-C", source, "log", "-1", "--format=%cI", "--", path)
      return nil unless status.success?

      value = stdout.strip
      value.empty? ? nil : value
    end

    # The page's file in the site source, or nil for a generated page.
    def source_path(site, page)
      path = page.is_a?(::Jekyll::Document) ? page.path : site.in_source_dir(page.relative_path)
      File.file?(path) ? path : nil
    end

    def relative(site, path)
      path.delete_prefix(File.join(site.source, "")).tr("\\", "/")
    end
  end
end

if defined?(Jekyll::Generator)
  module Slipway
    module LastModified
      # Runs after the pages are read and before they render; the doc layout reads the value.
      class Generator < ::Jekyll::Generator
        safe false
        priority :low

        def generate(site)
          pages = site.pages + site.collections.values.flat_map(&:docs)
          pages.each do |page|
            next unless page.data["layout"] == "doc"
            next if page.data["last_modified_at"]

            path = LastModified.source_path(site, page)
            next unless path

            modified = LastModified.from_git(site.source, LastModified.relative(site, path))
            page.data["last_modified_at"] = modified if modified
          end
        end
      end
    end
  end
end
