"""Produit les images statiques du site à partir de leurs originaux.

    pip install Pillow
    python scripts/optimize_images.py          (depuis le dossier frontend/)

Entrée : image-sources/<groupe>/<nom>.(png|jpg|jpeg|webp)
         Les originaux, lourds, ne sont ni servis ni copiés dans l'image Docker.
Sortie : public/static/<groupe>/<nom>-<largeur>.webp   fichiers servis, en plusieurs largeurs
         public/logo-192.webp                         logo de la coquille de l'application
         src/generated/staticImages.ts                dimensions et largeurs de chaque image

Pour ajouter une image : déposer l'original dans image-sources/<groupe>/ avec un nom en
minuscules, sans accent ni espace, relancer ce script, puis l'afficher avec <StaticImage name="<groupe>/<nom>" />.
Le script est rejouable : il régénère tout et retire les sorties dont l'original a disparu.
"""
from pathlib import Path
import re
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "image-sources"
OUTPUT = ROOT / "public" / "static"
MANIFEST = ROOT / "src" / "generated" / "staticImages.ts"

# Largeurs produites par groupe. Une image n'est jamais agrandie : au-delà de sa largeur
# d'origine, seule sa taille native est ajoutée.
DEFAULT_WIDTHS = (640, 1280, 1920)
GROUP_WIDTHS = {
    "about": (640, 1280),
    "bourses": (640, 1280),
}
# Le logo fait partie de la coquille de l'application : il reste servi par le site lui-même,
# hors de static/, dans une seule taille qui couvre tous ses affichages (80 px au plus, écrans 2x).
LOGO_SOURCE = SOURCES / "brand" / "logo.webp"
LOGO_OUTPUT = ROOT / "public" / "logo-192.webp"
LOGO_WIDTH = 192

QUALITY = 80
SAFE_NAME = re.compile(r"^[a-z0-9][a-z0-9-]*$")
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def variant_widths(source_width: int, targets: tuple[int, ...]) -> list[int]:
    widths = [w for w in targets if w < source_width]
    if source_width <= max(targets):
        widths.append(source_width)
    return widths


def prepared(image: Image.Image) -> Image.Image:
    """Mode compatible WebP ; le canal alpha est retiré s'il est entièrement opaque."""
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() or image.mode == "P" else "RGB")
    if image.mode == "RGBA" and image.getextrema()[3][0] == 255:
        image = image.convert("RGB")
    return image


def resized(image: Image.Image, width: int) -> Image.Image:
    if width == image.width:
        return image
    return image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)


def save_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=QUALITY, method=6)


def main() -> int:
    if not SOURCES.is_dir():
        print(f"dossier introuvable : {SOURCES}", file=sys.stderr)
        return 1

    manifest: dict[str, tuple[int, int, list[int]]] = {}
    expected: set[Path] = set()
    total = 0

    for source in sorted(SOURCES.rglob("*")):
        if not source.is_file() or source.suffix.lower() not in EXTENSIONS or source == LOGO_SOURCE:
            continue
        group = source.parent.relative_to(SOURCES).as_posix()
        if not SAFE_NAME.match(source.stem) or not SAFE_NAME.match(group):
            print(f"nom refusé (minuscules, chiffres et tirets uniquement) : {source.relative_to(ROOT)}", file=sys.stderr)
            return 1
        name = f"{group}/{source.stem}"
        if name in manifest:
            print(f"deux originaux pour la même image : {name}", file=sys.stderr)
            return 1

        with Image.open(source) as opened:
            image = prepared(opened)
            widths = variant_widths(image.width, GROUP_WIDTHS.get(group, DEFAULT_WIDTHS))
            for width in widths:
                target = OUTPUT / group / f"{source.stem}-{width}.webp"
                save_webp(resized(image, width), target)
                expected.add(target)
                total += target.stat().st_size
            manifest[name] = (image.width, image.height, widths)

    # Sorties dont l'original n'existe plus
    if OUTPUT.is_dir():
        for stale in OUTPUT.rglob("*.webp"):
            if stale not in expected:
                stale.unlink()
                print(f"retiré : {stale.relative_to(ROOT).as_posix()}")

    if LOGO_SOURCE.is_file():
        with Image.open(LOGO_SOURCE) as opened:
            save_webp(resized(prepared(opened), LOGO_WIDTH), LOGO_OUTPUT)

    lines = [
        "// Fichier généré par scripts/optimize_images.py — ne pas modifier à la main.",
        "// Dimensions d'origine et largeurs disponibles de chaque image statique du site.",
        "export const STATIC_IMAGES = {",
    ]
    for name in sorted(manifest):
        width, height, widths = manifest[name]
        lines.append(f'  "{name}": {{ width: {width}, height: {height}, widths: [{", ".join(map(str, widths))}] }},')
    lines += ["} as const;", "", "export type StaticImageName = keyof typeof STATIC_IMAGES;", ""]
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text("\n".join(lines), encoding="utf-8", newline="\n")

    print(f"{len(manifest)} images, {len(expected)} fichiers WebP, {total / 1024:.0f} Ko au total")
    return 0


if __name__ == "__main__":
    sys.exit(main())
