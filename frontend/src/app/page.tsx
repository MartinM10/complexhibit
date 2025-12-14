import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Calendar, Users, Image as ImageIcon } from "lucide-react";
import HashRedirect from "@/components/HashRedirect";

const categories = [
  {
    name: "Exhibitions",
    description: "Explore curated exhibitions from various institutions.",
    href: "/all/exhibition",
    icon: Calendar,
    color: "bg-blue-500",
  },
  {
    name: "Artworks",
    description: "Discover individual artworks and their details.",
    href: "/all/artwork",
    icon: ImageIcon,
    color: "bg-purple-500",
  },
  {
    name: "Institutions",
    description: "Find museums, galleries, and other cultural institutions.",
    href: "/all/institution",
    icon: Building2,
    color: "bg-green-500",
  },
  {
    name: "Actors",
    description: "Learn about the people and organizations involved.",
    href: "/all/actant",
    icon: Users,
    color: "bg-orange-500",
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      <HashRedirect />
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Explore the World of Exhibitions
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Exhibitium is your gateway to a semantic web of cultural heritage. 
              Discover connections between exhibitions, artworks, institutions, and people.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/search"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Start Searching
              </Link>
              <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-10 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.name} href={category.href} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200 hover:ring-indigo-500 transition-all hover:-translate-y-1">
                <div className={`flex h-32 items-center justify-center ${category.color} bg-opacity-10`}>
                  <category.icon className={`h-12 w-12 ${category.color.replace("bg-", "text-")}`} />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      <span className="absolute inset-0" />
                      {category.name}
                    </h3>
                    <p className="mt-3 text-base text-gray-500">{category.description}</p>
                  </div>
                  <div className="mt-6 flex items-center text-indigo-600 font-medium">
                    Browse {category.name} <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
