# frozen_string_literal: true

# Slipway source map, levels 1 and 2 (ADR 0007, spec/sourcemap/v0.md).
#
# For every Markdown page and document, parses the body with kramdown, the way Jekyll does, and
# records each heading (with the id the built HTML gives it) and each link, at its line in the source
# file, front matter included. In Actions mode Jekyll loads this file as a plugin and writes
# /sourcemap.json at build; on classic Pages, which runs no plugins, `npm run sourcemap` runs the
# same code (tools/sourcemap/sourcemap.rb) and the author commits the file.

require "cgi"
require "json"
require "kramdown"

module Slipway
  module Sourcemap
    # The kramdown the GitHub Pages gem runs; lines and ids are tested against it.
    KRAMDOWN_VERSION = "2.4.0"
    # The same front matter rule as Jekyll::Document.
    FRONT_MATTER = %r!\A(---\s*\n.*?\n?)^((---|\.\.\.)\s*$\n?)!m.freeze
    MARKDOWN_EXTENSIONS = %w(.md .markdown .mkdown .mkdn .mkd).freeze

    # The HTML converter, recording the id it writes on each header.
    class IdRecorder < ::Kramdown::Converter::Html
      def convert_header(el, indent)
        html = super
        tag = html[%r!<h[1-6][^>]*>!]
        id = tag && tag[%r!\sid="([^"]*)"!, 1]
        el.options[:slipway_id] = CGI.unescapeHTML(id) if id
        html
      end
    end

    module_function

    # The map for a site that has been read (site.read), as a Hash in the v0 format.
    def build(site)
      options = kramdown_options(site)
      pages = markdown_pages(site).map do |page|
        path = source_path(site, page)
        entry = { "url" => page.url, "source" => relative(site, path) }
        entry.merge!(lines(File.read(path, :encoding => "bom|utf-8"), options)) if options
        entry
      end
      { "version" => 0, "pages" => pages.sort_by { |p| p["url"] } }
    end

    def to_json(map)
      "#{JSON.pretty_generate(map)}\n"
    end

    # Sections and links of one source file (front matter included), with kramdown options as Jekyll
    # passes them. Lines are 1-based and count from the top of the file.
    def lines(source, options)
      offset = 0
      if (match = FRONT_MATTER.match(source))
        offset = match[0].count("\n")
        source = match.post_match
      end
      doc = ::Kramdown::Document.new(source, options)
      IdRecorder.convert(doc.root, doc.options)

      sections = []
      links = []
      walk(doc.root) do |el|
        line = el.options[:location]
        next unless line
        if el.type == :header && el.options[:slipway_id] && !el.options[:slipway_id].empty?
          sections << { "id" => el.options[:slipway_id], "level" => el.options[:level], "line" => line + offset, "text" => plain_text(el) }
        elsif link?(el)
          links << { "href" => el.attr["href"], "line" => line + offset }
        end
      end
      { "sections" => sections, "links" => links }
    end

    def link?(el)
      href = el.attr["href"]
      return false if href.nil? || href.empty?
      el.type == :a || (el.type == :html_element && el.value == "a")
    end

    # Depth-first, in document order, the order the HTML converter writes headers in.
    def walk(el, &block)
      yield el
      el.children.each { |child| walk(child, &block) }
    end

    # The heading as the built page shows it: Markdown removed, smart quotes and entities as characters.
    def plain_text(el)
      text = +""
      append = lambda do |child|
        case child.type
        when :text, :codespan, :math then text << child.value
        when :entity then text << child.value.char
        when :smart_quote then text << ::Kramdown::Utils::Entities.entity(child.value.to_s).char
        when :typographic_sym
          text << case child.value
                  when :laquo_space then "« "
                  when :raquo_space then " »"
                  else ::Kramdown::Utils::Entities.entity(child.value.to_s).char
                  end
        else child.children.each { |c| append.call(c) }
        end
      end
      el.children.each { |c| append.call(c) }
      text.strip
    end

    # The options Jekyll's kramdown converter uses, or nil when the site's Markdown is not kramdown
    # (then the map has url and source only).
    def kramdown_options(site)
      converter = site.find_converter_instance(::Jekyll::Converters::Markdown)
      converter.setup if converter.respond_to?(:setup)
      parser = converter.instance_variable_get(:@parser)
      return nil unless defined?(::Jekyll::Converters::Markdown::KramdownParser) && parser.is_a?(::Jekyll::Converters::Markdown::KramdownParser)
      parser.instance_variable_get(:@config)
    end

    # Pages and collection documents written from a Markdown file in the site source. Generated pages
    # (feeds, redirects, stubs without a file) are left out.
    def markdown_pages(site)
      docs = site.collections.values.flat_map(&:docs).select(&:write?)
      (site.pages + docs).select do |page|
        path = source_path(site, page)
        MARKDOWN_EXTENSIONS.include?(File.extname(path).downcase) && File.file?(path) && path.start_with?(File.join(site.source, ""))
      end
    end

    def source_path(site, page)
      page.is_a?(::Jekyll::Document) ? page.path : site.in_source_dir(page.relative_path)
    end

    def relative(site, path)
      path.delete_prefix(File.join(site.source, "")).tr("\\", "/")
    end
  end
end

if defined?(Jekyll::Generator)
  module Slipway
    module Sourcemap
      # /sourcemap.json, written as is: no layout and no Liquid, so link targets cannot be rendered.
      class MapFile < ::Jekyll::StaticFile
        def initialize(site, content)
          super(site, site.source, "", "sourcemap.json")
          @content = content
        end

        def modified?
          true
        end

        def write(dest)
          path = destination(dest)
          FileUtils.mkdir_p(::File.dirname(path))
          ::File.write(path, @content)
          true
        end
      end

      # Actions mode (level 2): generates the map at build, so it cannot go stale.
      class Generator < ::Jekyll::Generator
        safe false
        priority :lowest

        def generate(site)
          unless ::Kramdown::VERSION == KRAMDOWN_VERSION
            Jekyll.logger.warn "Slipway sourcemap:", "kramdown #{::Kramdown::VERSION}, tested with #{KRAMDOWN_VERSION}; check the lines"
          end
          # This map replaces the level 0 stub page and a committed level 1 file.
          site.pages.reject! { |page| page.url == "/sourcemap.json" }
          site.static_files.reject! { |file| file.relative_path.sub(%r!\A/!, "") == "sourcemap.json" }
          site.static_files << MapFile.new(site, Sourcemap.to_json(Sourcemap.build(site)))
        end
      end
    end
  end
end
