
export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-4">About Us</h1>
        
        <div className="prose prose-indigo text-gray-600 text-lg leading-relaxed">
          <p className="mb-6">
            Exhibitium is a cutting-edge platform designed to explore the interconnected world of art exhibitions, 
            actors, and artworks through the power of Semantic Web technologies.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Mission</h2>
          <p className="mb-6">
            Our mission is to provide researchers, art historians, and the general public with a structured and 
            rich interface to navigate complex cultural data. By leveraging ontologies and mapped data, we 
            uncover hidden relationships and provide deep insights into the history of exhibitions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">The Technology</h2>
          <p className="mb-6">
            Exhibitium is built upon a robust knowledge graph, utilizing standards like RDF, SPARQL, and OWL. 
            This allows for precise querying and data interconnection that traditional databases cannot match. 
            The backend is powered by modern semantic engines, while the frontend delivers a seamless exploration experience.
          </p>

           <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Contact</h2>
           <p className="mb-6">
             We value community feedback to improve our data quality and platform features.
             Have questions? Reach out to us via the <a href="/reports" className="text-indigo-600 hover:text-indigo-800 underline font-medium">Report Incidents</a> page
             or email us at <a href="mailto:contact@exhibitium.org" className="text-indigo-600 hover:text-indigo-800 underline font-medium">contact@exhibitium.org</a>.
           </p>
        </div>
      </div>
    </div>
  );
}
