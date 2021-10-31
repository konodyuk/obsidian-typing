import base64
from functools import partial

from jinja2 import Environment, FileSystemLoader

from mt.build import Build
from mt.config import cfg

build = Build()

jinja_env = Environment(loader=FileSystemLoader("."))

FONTS = [
    "fa-regular-400.woff2",
    "fa-brands-400.woff2",
    "fa-solid-900.woff2",
]
FONT_FILES = [f"fonts/{i}" for i in FONTS]
FONT_OUTPUTS = [f"base64/{i}.b64" for i in FONTS]


@build(
    target="../styles.css",
    deps=[
        "styles.css.j2",
        "plugin-styles.css",
        "fonts.css.j2",
    ],
)
def build_styles():
    template = jinja_env.get_template("styles.css.j2")
    with open("../styles.css", "w") as f:
        f.write(template.render(cfg))


@build(target="fonts.css.j2", deps=FONT_OUTPUTS)
def _():
    pass


def b64encode(file_in, file_out):
    with open(file_in, "rb") as f:
        out = base64.b64encode(f.read())
    with open(file_out, "wb") as f_out:
        f_out.write(out)


for font_in, font_out in zip(FONT_FILES, FONT_OUTPUTS):
    build(target=font_out, deps=[font_in])(
        partial(b64encode, file_in=font_in, file_out=font_out)
    )
