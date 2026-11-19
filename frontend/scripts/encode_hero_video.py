"""Produit la vidéo du hero de l'accueil et son poster à partir de l'original.

    python scripts/encode_hero_video.py        (depuis le dossier frontend/, ffmpeg requis)
    python scripts/optimize_images.py          (ensuite : variantes WebP du poster)

Entrée : video-sources/home/amame-hero.mp4     original 1920×1080, 9 s, jamais servi
Sortie : src/assets/video/hero-16x9.mp4         paysage 1280×720
         src/assets/video/hero-4x5.mp4          portrait 576×720, recadré au centre (mobiles)
         image-sources/home/hero-poster.png     première image de la boucle, en pleine définition

L'original commence par un fondu depuis le noir (0 à 0,52 s) et finit par un fondu au noir
(8,44 à 9 s) : en boucle, un flash noir apparaîtrait toutes les 9 s. On garde 0,52 → 8,44 s, puis
les 0,6 dernières secondes se fondent dans les 0,6 premières : la boucle de 7,32 s n'a pas de
couture. Elle commence donc à 1,12 s de l'original, et le poster est pris à cet instant : il est
identique à la première image de la vidéo, qui apparaît sans saut par-dessus.

Chaque vidéo doit peser moins de 1 Mo : le script échoue sinon. Les fichiers produits sont
versionnés ; le build Docker n'a pas besoin de ffmpeg. Le script est rejouable.
"""
from pathlib import Path
import json
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "video-sources" / "home" / "amame-hero.mp4"
OUTPUT = ROOT / "src" / "assets" / "video"
POSTER = ROOT / "image-sources" / "home" / "hero-poster.png"

# Bornes mesurées sur l'original (luminance moyenne image par image), en secondes
TRIM_START = 0.52   # fin du fondu depuis le noir (image 13 à 25 images/s)
TRIM_END = 8.44     # début du fondu au noir (image 211)
CROSSFADE = 0.6     # fondu enchaîné de la jonction de boucle
SOURCE_SIZE = (1920, 1080)
MAX_BYTES = 1_000_000

# (fichier, géométrie ffmpeg, CRF) : CRF plus élevé = fichier plus léger
VARIANTS = [
    ("hero-16x9.mp4", "scale=1280:720", 29),
    ("hero-4x5.mp4", "crop=864:1080:528:0,scale=576:720", 27),
]
X264 = ["-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-g", "50", "-movflags", "+faststart", "-an", "-map_metadata", "-1"]


def run(args: list[str]) -> str:
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def probe(path: Path) -> dict:
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
               "stream=width,height:format=duration", "-of", "json", str(path)])
    data = json.loads(out)
    stream = data["streams"][0]
    return {"width": stream["width"], "height": stream["height"], "duration": float(data["format"]["duration"])}


def main() -> int:
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            print(f"{tool} introuvable dans le PATH", file=sys.stderr)
            return 1
    if not SOURCE.is_file():
        print(f"original introuvable : {SOURCE.relative_to(ROOT)}", file=sys.stderr)
        return 1
    source = probe(SOURCE)
    if (source["width"], source["height"]) != SOURCE_SIZE:
        print(f"original en {source['width']}×{source['height']} : le recadrage suppose {SOURCE_SIZE[0]}×{SOURCE_SIZE[1]}",
              file=sys.stderr)
        return 1

    clip = TRIM_END - TRIM_START
    loop_filter = (
        "[0:v]split[a][b];"
        f"[a]trim=start={CROSSFADE},setpts=PTS-STARTPTS[main];"
        f"[b]trim=end={CROSSFADE},setpts=PTS-STARTPTS[head];"
        f"[main][head]xfade=transition=fade:duration={CROSSFADE}:offset={clip - 2 * CROSSFADE:.2f},"
    )
    OUTPUT.mkdir(parents=True, exist_ok=True)
    failed = False
    for name, geometry, crf in VARIANTS:
        target = OUTPUT / name
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{TRIM_START}", "-to", f"{TRIM_END}",
             "-i", str(SOURCE), "-filter_complex", loop_filter + geometry + "[v]", "-map", "[v]",
             *X264, "-crf", str(crf), str(target)])
        info, size = probe(target), target.stat().st_size
        print(f"{target.relative_to(ROOT).as_posix()} : {info['width']}×{info['height']}, "
              f"{info['duration']:.2f} s, {size} octets")
        if size >= MAX_BYTES:
            print(f"  trop lourd : {size} octets, plafond {MAX_BYTES}", file=sys.stderr)
            failed = True

    POSTER.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{TRIM_START + CROSSFADE:.2f}",
         "-i", str(SOURCE), "-frames:v", "1", str(POSTER)])
    print(f"{POSTER.relative_to(ROOT).as_posix()} : poster pris à {TRIM_START + CROSSFADE:.2f} s de l'original")
    print("Ensuite : python scripts/optimize_images.py")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
