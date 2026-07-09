# Flake install

This flake packages the **browser search CLI** (`torlnk`). Full downloads require the [Torlink-Gui desktop app](https://github.com/Domanffe/torlink-gui/releases).

```nix
inputs = {
  torlink-gui.url = "github:Domanffe/torlink-gui";
};
```

**User (`home.nix`)**

```nix
{ pkgs, inputs, ... }:
{
  home.packages = [
    inputs.torlink-gui.packages.${pkgs.system}.default
  ];
}
```

**System (`configuration.nix`)**

```nix
{ pkgs, inputs, ... }:
{
  environment.systemPackages = [
    inputs.torlink-gui.packages.${pkgs.system}.default
  ];
}
```

After bumping `version` in `nix/package.nix`, refresh `src` and `npmDepsHash` with `nix-prefetch-url` / `nix-build`.
