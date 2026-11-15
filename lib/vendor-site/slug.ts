/**
 * Vendor website addresses (bridalteam.com/biz/<slug>). The database decides
 * (vendor_site_slug_problem in migration 20261115190000_vendor_websites.sql,
 * same rules as wedding addresses); this turns its answer into a sentence
 * for a business.
 */
export { toSlug } from "@/lib/custom-site/slug";

export function vendorSlugProblemMessage(problem: string): string {
  switch (problem) {
    case "format":
      return "Use 3–40 letters, numbers and single hyphens, starting and ending with a letter or number.";
    case "reserved":
      return "That address is reserved. Try your business name, or add your city.";
    case "blocked":
      return "That address isn't allowed. Please choose another.";
    case "taken":
      return "Another business is already using that address. Try adding your city or what you do, like keb-tech-miami.";
    default:
      return "Couldn't use that address. Please try another.";
  }
}
