Gem::Specification.new do |spec|
  spec.name          = "slipway-theme"
  spec.version       = "0.1.0"
  spec.authors       = ["Slipway contributors"]
  spec.summary       = "An editorial, RTL-ready, agent-native Jekyll theme, verified by Seaworthy."
  spec.homepage      = "https://github.com/arminazimi/slipway"
  spec.license       = "MIT"

  spec.files = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{\A(_layouts|_includes|_sass|assets)/|\ALICENSE\z})
  end

  spec.required_ruby_version = ">= 3.3"
  spec.add_runtime_dependency "jekyll", ">= 3.9", "< 5.0"
end
