-- Slipway's Quarto filter: adds data-source="<source>:<line>" to every heading it can match to a
-- line in the page's own source file, so an edit prompt can name the line (ae.edit-prompt.source).
--
-- Quarto does not tell a filter where a heading sits in its file, so this reads the .qmd file and
-- finds its ATX and setext headings, skipping front matter and fenced code. Headings run in document
-- order, so a repeated title takes the next matching line each time. A heading that comes from an
-- include, a shortcode, or a template has no line here and gets no data-source.

local function posix(path)
  return (path:gsub("\\", "/"))
end

-- The path relative to the project folder, with forward slashes, or nil when it is outside it.
local function relative(path, root)
  path, root = posix(path), posix(root)
  if root:sub(-1) ~= "/" then root = root .. "/" end
  if path:sub(1, #root) == root then return path:sub(#root + 1) end
  return nil
end

local function read_lines(path)
  local file = io.open(path, "rb")
  if not file then return nil end
  local text = file:read("*a")
  file:close()
  text = text:gsub("\r\n", "\n"):gsub("\r", "\n")
  local lines = {}
  for line in (text .. "\n"):gmatch("(.-)\n") do
    lines[#lines + 1] = line
  end
  return lines
end

local entities = { ["&amp;"] = "&", ["&lt;"] = "<", ["&gt;"] = ">", ["&quot;"] = '"', ["&apos;"] = "'", ["&nbsp;"] = " " }

-- Letters and digits only, lowercased: how a source heading is matched to its rendered text.
local function key(text)
  for entity, character in pairs(entities) do
    text = text:gsub(entity, character)
  end
  return (pandoc.text.lower(text):gsub("[%s%p]", ""))
end

-- A heading's text without a trailing attribute block ({#id .class}) or closing hashes.
local function heading_text(text)
  text = text:gsub("%s*{[^}]*}%s*$", "")
  text = text:gsub("%s*#+%s*$", "")
  return text
end

local function is_break(text)
  local markers = text:gsub("%s", "")
  if #markers < 3 then return false end
  return markers:match("^%-+$") ~= nil or markers:match("^%*+$") ~= nil or markers:match("^_+$") ~= nil
end

-- The Markdown headings of a source file, in order: { line, level, key }, with the line counted from
-- the top of the file, front matter included.
local function source_headings(path)
  local lines = read_lines(path)
  if not lines then return {} end
  local headings = {}

  local i = 1
  if lines[1] and lines[1]:match("^%-%-%-%s*$") then
    local close = 2
    while close <= #lines and not lines[close]:match("^%-%-%-%s*$") do
      close = close + 1
    end
    if close <= #lines then i = close + 1 end
  end

  local fence = nil
  while i <= #lines do
    local line = lines[i]
    local advance = 1
    if fence then
      local close = line:match("^%s*(" .. fence:sub(1, 1) .. "+)%s*$")
      if close and #close >= #fence then fence = nil end
    else
      local marker = line:match("^%s*(```+)") or line:match("^%s*(~~~+)")
      if marker then
        fence = marker
      else
        local indent, rest = line:match("^(%s*)(.*)$")
        if #indent <= 3 and rest:match("%S") then
          local hashes, text = rest:match("^(#+)%s+(.+)$")
          if hashes and #hashes <= 6 then
            headings[#headings + 1] = { line = i, level = #hashes, key = key(heading_text(text)) }
          elseif not rest:match("^%s*[>#]") and not rest:match("^%s*[-*+]%s+") and not rest:match("^%s*%d+[.)]%s+") and not is_break(rest) then
            local underline = lines[i + 1] and lines[i + 1]:match("^%s*(=+)%s*$")
            local level = underline and 1 or 0
            if level == 0 then
              underline = lines[i + 1] and lines[i + 1]:match("^%s*(%-+)%s*$")
              level = underline and 2 or 0
            end
            if level > 0 then
              headings[#headings + 1] = { line = i, level = level, key = key(heading_text(rest)) }
              advance = 2
            end
          end
        end
      end
    end
    i = i + advance
  end

  return headings
end

local input = quarto and quarto.doc and quarto.doc.input_file
local root = quarto and quarto.project and quarto.project.directory
local source = nil
if input and root then
  local lower = pandoc.text.lower(input)
  if lower:match("%.qmd$") or lower:match("%.md$") then
    source = relative(input, root)
  end
end
local headings = source and source_headings(input) or {}

function Pandoc(doc)
  if not source or #headings == 0 then return doc end
  local taken = {}
  return doc:walk({
    Header = function(element)
      local text = key(pandoc.utils.stringify(element.content))
      if text == "" then return element end
      for index, heading in ipairs(headings) do
        if not taken[index] and heading.level == element.level and heading.key:find(text, 1, true) then
          taken[index] = true
          element.attributes["data-source"] = source .. ":" .. heading.line
          break
        end
      end
      return element
    end,
  })
end
