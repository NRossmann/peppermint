{ pkgs ? import <nixpkgs> {} }:

let
  yarnShim = pkgs.writeShellScriptBin "yarn" ''
    exec ${pkgs.nodejs_20}/bin/corepack yarn "$@"
  '';
in
pkgs.mkShell {
  packages = with pkgs; [
    nodejs_20
    yarnShim
    openssl
    prisma-engines
  ];

  shellHook = ''
    export COREPACK_ENABLE_AUTO_PIN=0
    export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
    export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
    export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
    export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
    export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"

    corepack enable >/dev/null 2>&1 || true
    corepack prepare yarn@4.2.2 --activate >/dev/null 2>&1 || true

    echo "Node: $(node --version)"
    echo "Yarn: $(yarn --version)"
  '';
}
