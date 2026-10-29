# frozen_string_literal: true

# Slipway per-page social images (`pub.og-image`): in Actions mode every page shares its own picture,
# generated from its title, so a link to any page shows that page and not the site. Classic Pages runs
# no plugins; there `_includes/seo.html` falls back to the site's shared `assets/images/social.png`
# (docs/overrides.md), and a page can set its own picture with the `image` front-matter key in either
# mode.
#
# Like the twins plugin, a site opts in by copying this file into its `_plugins/`; a site that draws
# its own images leaves it out. Each page gets `assets/images/og/<page address>.png`, a 1200×630 PNG
# with the title set on the theme's dark palette, and `page.slipway_og` for `seo.html`. Pure Ruby
# standard library (zlib only): an Actions build installs no image libraries. The title is set in the
# classic 5×7 GLCD bitmap font, public domain as shipped in the Adafruit GFX library, so the picture
# needs no font files either — which also means it needs Latin letters: a title the font cannot
# render, such as a Persian or Chinese one, keeps the shared image rather than a broken picture.

require "fileutils"
require "set"
require "zlib"

module Slipway
  module OG
    WIDTH = 1200
    HEIGHT = 630
    DIR = "assets/images/og"
    MARGIN = 96
    # At most three lines of title, tried at these glyph scales (a 5×7 glyph at scale s is 5s wide).
    SCALES = [8, 7, 6, 5, 4].freeze
    LINE = 11 # line height in glyph pixels: 7 rows of glyph plus 4 of gap
    BAR = 12  # the accent bar across the top
    # The theme's dark palette (assets/css/tokens.css): canvas, heading text, muted text, and rose.
    BACKGROUND = [0x26, 0x24, 0x25].pack("C3").freeze
    TEXT = [0xef, 0xe8, 0xe8].pack("C3").freeze
    MUTED = [0x9a, 0x93, 0x92].pack("C3").freeze
    ACCENT = [0xb5, 0x8d, 0x90].pack("C3").freeze
    # Punctuation ASCII lacks, folded to its ASCII stand-in before the glyph check.
    FOLD = {
      "\u2018" => "'", "\u2019" => "'", "\u201C" => "\"", "\u201D" => "\"",
      "\u2013" => "-", "\u2014" => "-", "\u2026" => "...", "\t" => " ",
    }.freeze
    # The 5×7 GLCD font, 128 glyphs for byte codes 0..127: five columns per glyph, bit 0 the top
    # row. Each ASCII character sits at its own code; codes below 32 are junk the renderer skips.
    FONT = <<~B64.unpack1("m").freeze
      AAAAAAA+W09bPj5rT2s+HD58PhwYPH48GBxXfVccHF5/XhwAGDwYAP/nw+f/ABgkGAD/59vn/zBI
      OgYOJil5KSZAfwUFB0B/BSU/WjznPFp/PhwcCAgcHD5/FCJ/IhRfXwBfXwYJfwF/AGaJlWpgYGBg
      YJSi/6KUCAR+BAgQIH4gEAgIKhwICBwqCAgeEBAQEAweDB4MMDg+ODAGDj4OBgAAAAAAAABfAAAA
      BwAHABR/FH8UJCp/KhIjEwhkYjZJViBQAAgHAwAAHCJBAABBIhwAKhx/HCoICD4ICACAcDAACAgI
      CAgAAGBgACAQCAQCPlFJRT4AQn9AAHJJSUlGIUFJTTMYFBJ/ECdFRUU5PEpJSTFBIREJBzZJSUk2
      RklJKR4AABQAAABANAAAAAgUIkEUFBQUFABBIhQIAgFZCQY+QV1ZTnwSERJ8f0lJSTY+QUFBIn9B
      QUE+f0lJSUF/CQkJAT5BQVFzfwgICH8AQX9BACBAQT8BfwgUIkF/QEBAQH8CHAJ/fwQIEH8+QUFB
      Pn8JCQkGPkFRIV5/CRkpRiZJSUkyAwF/AQM/QEBAPx8gQCAfP0A4QD9jFAgUYwMEeAQDYVlJTUMA
      f0FBQQIECBAgAEFBQX8EAgECBEBAQEBAAAMHCAAgVFR4QH8oREQ4OERERCg4REQofzhUVFQYAAh+
      CQIYpKSceH8IBAR4AER9QAAgQEA9AH8QKEQAAEF/QAB8BHgEeHwIBAR4OERERDj8GCQkGBgkJBj8
      fAgEBAhIVFRUJAQEP0QkPEBAIHwcIEAgHDxAMEA8RCgQKERMkJCQfERkVExEAAg2QQAAAHcAAABB
      NggAAgECBAI8JiMmPA==
    B64

    module_function

    # The generated image's output path for a page address. `/`, `/guide/`, and `/guide/index.html`
    # all map under their own folders, and `/about.html` drops its extension, so the pictures sit at
    # clean names where a site's assets sit. `/about.html` and `/about/` both want `about.png`; the
    # generator breaks that tie with the address.
    def image_path(url)
      rel = url.delete_prefix("/").sub(/index\.html?\z/, "").sub(/\.html?\z/, "").chomp("/")
      rel = "index" if rel.empty?
      "#{DIR}/#{rel}.png"
    end

    # The title as the font can set it, or nil when it cannot: punctuation without ASCII glyphs is
    # folded, and any character left outside printable ASCII means the page keeps the shared image.
    def text_of(title)
      text = title.chars.map { |ch| FOLD[ch] || ch }.join.gsub(%r{</?[a-z][^>]*>}i, "").strip
      text.each_char.all? { |ch| ch.ord.between?(32, 126) } ? text : nil
    end

    # Pages that get a generated image, as { path:, page:, title:, site_title:, url: }: written
    # pages with a renderable title (the site title stands in) that set no `image` of their own.
    def plans(site)
      docs = site.collections.values.flat_map(&:docs).select(&:write?)
      site_title = site.config["title"].to_s
      (site.pages + docs).filter_map do |page|
        next unless page.write?
        next if page.data["image"]
        title = text_of((page.data["title"] || site_title).to_s)
        next if title.nil? || title.empty?
        { path: image_path(page.url), page: page, title: title, site_title: site_title, url: page.url }
      end
    end

    # Breaks the title into lines a row can hold, hard-breaking words wider than a row.
    def wrap(text, columns)
      lines = []
      line = +""
      text.split(" ").each do |word|
        while word.length > columns
          lines << (line.empty? ? word.slice!(0, columns) : line)
          line = +""
        end
        if line.empty? then line = word.dup
        elsif line.length + 1 + word.length <= columns then line << " " << word
        else lines << line
             line = word.dup
        end
      end
      lines << line unless line.empty?
      lines
    end

    # [lines, scale]: the largest scale whose wrap fits three lines, else the smallest scale with the
    # overflow cut to an ellipsis.
    def fit_title(text)
      columns = ->(scale) { (WIDTH - 2 * MARGIN) / (6 * scale) }
      SCALES.each do |scale|
        lines = wrap(text, columns.call(scale))
        return [lines, scale] if lines.size <= 3
      end
      width = columns.call(SCALES.last)
      lines = wrap(text, width)[0, 3]
      lines[-1] = "#{lines[-1][0, width - 3]}..." if lines[-1].length > width - 3
      [lines, SCALES.last]
    end

    # One round dot of the bitmap, at a glyph pixel's center. The dots overlap, so a stroke reads as
    # one rounded line and not a row of beads.
    def dots(scale)
      radius = (scale * 0.6).round
      @dots ||= {}
      @dots[radius] ||= (-radius..radius).flat_map do |dx|
        (-radius..radius).filter_map { |dy| [dx, dy] if dx * dx + dy * dy <= radius * radius }
      end
    end

    def stamp(rows, cx, cy, scale, color)
      dots(scale).each do |dx, dy|
        x = cx + dx
        y = cy + dy
        next if x.negative? || x >= WIDTH || y.negative? || y >= HEIGHT
        rows[y][x * 3, 3] = color
      end
    end

    def draw_text(rows, text, x, y, scale, color)
      text.each_char do |ch|
        code = ch.ord
        if code.between?(32, 126)
          FONT.byteslice(code * 5, 5).bytes.each_with_index do |column, cx|
            7.times do |ry|
              next unless column[ry] == 1
              stamp(rows, x + cx * scale + scale / 2, y + ry * scale + scale / 2, scale, color)
            end
          end
        end
        x += 6 * scale
      end
    end

    # The picture's pixels, three bytes per pixel, one binary string per row.
    def render(title, site_title)
      background = BACKGROUND * WIDTH
      rows = Array.new(HEIGHT) { background.dup }
      bar = ACCENT * WIDTH
      BAR.times { |y| rows[y] = bar.dup }
      draw_text(rows, site_title, MARGIN, 64, 4, MUTED) unless site_title.empty?
      lines, scale = fit_title(title)
      # The block floats in the band under the site title, so a short title does not hug the top.
      height = ((lines.size - 1) * LINE + 7) * scale
      y = 140 + [(HEIGHT - 90 - 140 - height) / 2, 0].max
      lines.each { |line| draw_text(rows, line, MARGIN, y, scale, TEXT); y += LINE * scale }
      rows
    end

    # A basic PNG: signature, 8-bit RGB, one filter byte (none) per row, one deflate stream.
    SIGNATURE = "\x89PNG\r\n\x1a\n".b.freeze
    NONE = "\x00".b.freeze

    def png(rows)
      ihdr = [WIDTH, HEIGHT, 8, 2, 0, 0, 0].pack("NNC5")
      idat = Zlib::Deflate.deflate(rows.map { |row| NONE + row }.join)
      SIGNATURE + chunk("IHDR", ihdr) + chunk("IDAT", idat) + chunk("IEND", "")
    end

    def chunk(type, data)
      [data.bytesize, type, data, Zlib.crc32(type + data)].pack("NA*A*N")
    end

    # The addresses another page's picture already claims, plus any file the site itself keeps there.
    def taken(site)
      files = site.static_files.map { |file| file.path.delete_prefix("#{site.source}/") }
      Set.new(files)
    end
  end
end

if defined?(Jekyll::Generator)
  module Slipway
    module OG
      # One generated picture, written as is at build.
      class ImageFile < ::Jekyll::StaticFile
        def initialize(site, path, url, title, site_title)
          super(site, site.source, File.dirname(path), File.basename(path))
          @path = path
          @url = url
          @title = title
          @site_title = site_title
        end

        def modified?
          true
        end

        def destination(dest)
          @site.in_dest_dir(dest, @path)
        end

        def write(dest)
          path = destination(dest)
          FileUtils.mkdir_p(File.dirname(path))
          File.binwrite(path, OG.png(OG.render(@title, @site_title)))
          true
        end
      end

      # Actions mode: the pictures are generated at build, so they cannot go stale, and pages point
      # at them through page.slipway_og (_includes/seo.html).
      class Generator < ::Jekyll::Generator
        safe false
        priority :low

        def generate(site)
          claimed = OG.taken(site)
          OG.plans(site).each do |plan|
            path = plan[:path]
            if claimed.include?(path)
              # Two addresses can collapse onto one name (`/a.html` and `/a/`): break the tie with
              # the address, so the name is stable across builds.
              path = path.sub(/\.png\z/) { |ext| "-#{Zlib.crc32(plan[:url]).to_s(36)}#{ext}" }
            end
            claimed.add(path)
            plan[:page].data["slipway_og"] = "/#{path}"
            site.static_files << ImageFile.new(site, path, plan[:url], plan[:title], plan[:site_title])
          end
        end
      end
    end
  end
end
