const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-1 sm:p-2   text-center shrink-0 shadow-inner">
      <div className="container mx-auto text-xs md:text-sm ">
        Map data &copy;
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          OpenStreetMap contributors
        </a>
        . Powered by Nominatim, Overpass API. &copy; {new Date().getFullYear()}
        ChemnitzCulturalSitesApp.
      </div>
    </footer>
  );
};

export default Footer;
