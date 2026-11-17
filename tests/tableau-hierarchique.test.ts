import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Tableau, type Colonne } from "../src/ui/Tableau";

/*
 * Un tableau hiérarchique ne se trie pas : l'ordre des lignes est celui de la
 * hiérarchie, et un tri générique avait été rejeté sur un compte de résultat,
 * où il cassait la lecture comptable. Le contrôle de tri est un bouton dans
 * l'en-tête ; on cherche donc ce bouton, pas des classes de style.
 */

type Ligne = { cle: string; libelle: string };

const lignes: Ligne[] = [
  { cle: "a", libelle: "Produits" },
  { cle: "b", libelle: "Charges" },
];
const colonnes: Colonne<Ligne>[] = [{ cle: "libelle", titre: "Libellé" }];

// Un tableau dont on compte les en-têtes qui se laissent trier au clic.
function enTetesTriables(enfants?: (ligne: Ligne) => Ligne[]): number {
  const html = renderToStaticMarkup(
    createElement(Tableau<Ligne>, { id: "essai-hierarchique", colonnes, lignes, cleLigne: (l) => l.cle, enfants })
  );
  const entete = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"));
  return (entete.match(/<button/g) ?? []).length;
}

describe("tableau hiérarchique : pas de tri", () => {
  it("ne propose aucun tri d'en-tête en mode hiérarchique, quand un tableau à plat en propose un par colonne (un tri générique cassait la lecture d'un compte de résultat)", () => {
    expect(enTetesTriables(() => [])).toBe(0);
    expect(enTetesTriables()).toBe(colonnes.length);
  });
});
