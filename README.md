<p align="center">
  <img src="preview/splash.svg" alt="torlink, curated torrents straight from your terminal" style="max-width: 832px; width: 100%; height: auto;">
</p>

torlink is a torrent finder that lives in your terminal, with zero setup and nothing to configure. One search checks a short, curated list of reputable sources at once, and whatever you pick downloads straight to your computer. The files are yours, saved to your downloads folder.

## Get started

1. **Install Node.** It's a free tool from [nodejs.org](https://nodejs.org), the one thing torlink runs on.
2. **Open your terminal.**
3. **Run torlink:**

   ```sh
   npx torlink
   ```

That's it, nothing else to install. Once it's open you can paste a magnet link straight into the search box. You can also start from the command line:

```sh
npx torlink "magnet:?xt=..."   # start from a magnet link
npx torlink ./file.torrent     # open a .torrent file
npm install -g torlink         # install for good, then run: torlink
```

## What it does

- **One search, every source.** Type once and torlink checks them all together, showing each result's size and how many people are sharing it.
- **Curated, not a free-for-all.** A small, vetted set of sources, tagged so you always know where a result came from.
- **Downloads only, never seeds.** Files come to your computer and stop there. torlink never sends them back out.
- **Nothing to configure.** It opens straight to a search box, ready the moment it starts.

## Finding something

Type what you're looking for and press Enter. torlink checks every source at once, and results show up as each one answers, so you're never stuck waiting on a slow one. Each result lists its size and how many people are sharing it, so you can see which one will come down fast. Arrow to the one you want, press `d`, and it saves to your downloads folder. Leave the box empty and press Enter to just see what's new across every source.

<p align="center">
  <img src="preview/browse.svg" alt="torlink's browse view: the sidebar, the search bar, and merged results from every source" style="max-width: 832px; width: 100%; height: auto;">
</p>

## Your downloads

Your active downloads and the stuff you've already grabbed share one pane. Whatever's still coming down sits up top with its progress, speed, and time left. When a file finishes it drops into Recently downloaded just below, so the list stays tidy instead of piling up. Anything there is one key from downloading again, and it's all still waiting when you come back, resuming anything that got interrupted.

<p align="center">
  <img src="preview/downloads.svg" alt="torlink's Downloads pane: live progress on top, recently downloaded below" style="max-width: 832px; width: 100%; height: auto;">
</p>

## What it searches

A short, hand-picked set instead of a directory of unknowns:

| Category | Sources |
| --- | --- |
| Games | FitGirl |
| Movies | YTS, The Pirate Bay, 1337x |
| TV | EZTV, SolidTorrents, The Pirate Bay, 1337x |
| Anime | Nyaa, SubsPlease |

Games are the only category that can run code, so they come from FitGirl alone, a repacker with a long, trusted track record; everything else is plain video and subtitles. A source being down never stops a search, the others keep going and torlink tells you which one is offline.

## Local Development

To run or work on torlink locally:

1. Clone the repository and open the folder.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development version:
   ```sh
   npm run dev
   ```
   Or build it and run the bundled version:
   ```sh
   npm run build
   npx torlink
   ```

## Star History

<a href="https://www.star-history.com/?repos=baairon%2Ftorlink&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=baairon/torlink&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=baairon/torlink&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=baairon/torlink&type=date&legend=top-left" />
 </picture>
</a>
