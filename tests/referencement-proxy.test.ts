import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROUTES_OUVERTES } from "../src/briques/comptes/protection";
import { REFERENCEMENT, reglesRobots } from "../src/lib/referencement";
import { proxy } from "../src/proxy";
import { poserLesMethodes } from "./aide-comptes";

/*
 * Un site fermé aux moteurs l'est par `noindex` seul : un `Disallow` dans
 * robots.txt empêche les robots de lire ce `noindex` (leçon A16 du registre :
 * des liens à jeton donnés à des clients sont sortis des moteurs par
 * X-Robots-Tag, sans Disallow). Retirer le Disallow ouvrirait aux moteurs les
 * pages ouvertes sans connexion (mentions légales, contact) et les routes que
 * les robots lisent, si le proxy ne posait pas l'en-tête sur toute réponse.
 * C'est le cas fautif que ce fichier attrape.
 */

const NOINDEX = "noindex, nofollow";
const requete = (chemin: string) => new NextRequest(`http://localhost${chemin}`);

// Une page sans connexion, une page derrière la connexion (redirigée), une
// route lue par les robots, une route technique, un chemin inconnu (404).
const CHEMINS = [...ROUTES_OUVERTES, ...REFERENCEMENT.pagesPubliques, "/une-page-fermee", "/", "/inconnu/x"];

// La configuration de l'appli est copiée puis rétablie : une appli assemblée a
// rempli la sienne, et ce test ne doit pas l'écraser.
const CONFIGURATION_DE_L_APPLI = { ...REFERENCEMENT };

afterEach(() => {
  vi.unstubAllEnvs();
  poserLesMethodes(null);
  Object.assign(REFERENCEMENT, CONFIGURATION_DE_L_APPLI);
});

describe("noindex par en-tête, posé par le proxy quand l'indexation n'est pas autorisée", () => {
  it("pose noindex sur toute réponse d'un site fermé, pages ouvertes sans connexion et redirections comprises (sans le Disallow, rien d'autre ne les ferme)", () => {
    for (const chemin of CHEMINS) {
      expect(proxy(requete(chemin)).headers.get("x-robots-tag"), chemin).toBe(NOINDEX);
    }
  });

  it("laisse robots.txt lisible : un site fermé n'interdit rien, il se ferme par noindex", () => {
    expect(JSON.stringify(reglesRobots())).not.toMatch(/disallow/i);
    expect(reglesRobots()).toEqual({ rules: { userAgent: "*", allow: "/" } });
  });

  it("ne pose aucun en-tête noindex sur un site public ouvert, en production, à son adresse", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("URL_PUBLIQUE", "https://www.exemple.test");
    vi.stubEnv("IP_EN_TETE_CLIENT", "cf-connecting-ip");
    poserLesMethodes(["code-email"]);
    Object.assign(REFERENCEMENT, { nom: "Exemple", sitePublic: true, description: "Un site d'exemple." });
    for (const chemin of ["/mentions-legales", "/contact", "/robots.txt"]) {
      expect(proxy(requete(chemin)).headers.get("x-robots-tag"), chemin).toBeNull();
    }
  });

  it("garde noindex sur un site déclaré public mais incomplet : sans URL_PUBLIQUE, il reste fermé", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("URL_PUBLIQUE", "");
    vi.stubEnv("IP_EN_TETE_CLIENT", "cf-connecting-ip");
    poserLesMethodes(["code-email"]);
    Object.assign(REFERENCEMENT, { nom: "Exemple", sitePublic: true, description: "Un site d'exemple." });
    for (const chemin of ["/mentions-legales", "/contact"]) {
      expect(proxy(requete(chemin)).headers.get("x-robots-tag"), chemin).toBe(NOINDEX);
    }
  });
});
