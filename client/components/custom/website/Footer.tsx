import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black w-full py-10 text-[#C9A39A]">
      <div className="flex flex-col items-center justify-center px-4">

        {/* --- TOP MENU ROW --- */}
        {/* Mobile: 1 col, Tablet/Desktop: 3 cols */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20 lg:gap-40 text-center w-full max-w-6xl">

          {/* Column 1 */}
          <div className="flex flex-col gap-2 text-center font-adornstoryserif tracking-wider">
            <Link href="/"><p className="text-lg hover:text-red-500   transition-all">HOME</p></Link>
            <Link href="/brand"><p className="text-lg hover:text-red-500  transition-all">BRAND</p></Link>
            <Link href="/shows-and-events"><p className="text-lg hover:text-red-500 transition-all">SHOWS/EVENTS</p></Link>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col text-center gap-2 font-adornstoryserif tracking-wider">
            <Link href="/contact-us"><p className="text-lg hover:text-red-500 transition-all">CONTACT US</p></Link>
            <Link href="/find-a-store"><p className="text-lg hover:text-red-500 transition-all">FIND A STORE</p></Link>
            <Link href="/size-chart"><p className="text-lg hover:text-red-500 transition-all">SIZE CHART</p></Link>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col text-center gap-2 font-adornstoryserif tracking-wider">
            <div className="text-lg font-bold mb-1 opacity-80">FOLLOW US</div>
            <a href="https://www.facebook.com/chicandholland" target="_blank" rel="noopener noreferrer">
              <p className="text-lg hover:text-red-500 transition-all">FACEBOOK</p>
            </a>
            <a href="https://www.instagram.com/chicandholland/" target="_blank" rel="noopener noreferrer">
              <p className="text-lg hover:text-red-500 transition-all">INSTAGRAM</p>
            </a>
          </div>
        </div>

        {/* --- MIDDLE LOGO --- */}
        <div className="mb-4">
          <Link href = "/">
          <img
            src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/brand_page/CH%20Monogram_Rose%20Gold.png"
            className="w-[100px] md:w-[200px] lg:w-[250px] object-contain"
            alt="Chic & Holland Monogram"
          />
          </Link>
          
        </div>

        {/* --- MAIN BRAND TITLE --- */}
        <div className="w-full flex justify-center">
          <Link href="/" >
            <img
            src="/brand-logo.png"
            className="w-[250px] md:w-[500px] lg:w-[700px] object-contain"
            alt="Chic & Holland Full Logo"
          />
          </Link>
          
        </div>

        {/* Optional: Copyright Section */}
        <div className="mt-8 text-[10px] md:text-xs tracking-[0.2em] opacity-50">
          © {new Date().getFullYear()} CHIC & HOLLAND. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}