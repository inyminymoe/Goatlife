import Image from 'next/image';
import IconLogo from '../ui/icons/IconLogo';

export default function Footer() {
  return (
    <footer className="w-full bg-[hsl(216_65%_20%)] text-white px-4 py-4 md:px-16 lg:px-64 flex flex-col md:flex-row items-center justify-center gap-4 mt-5">
      <IconLogo
        variant="en"
        width={112}
        height={14}
        isDarkMode={true}
        className="flex-shrink-0"
      />

      <div className="text-center text-12 order-last md:order-none font-light flex items-center gap-2 flex-wrap justify-center">
        <span>© 2025 Goatlife All Rights Reserved</span>
        <span>|</span>
        <span>이용약관</span>
        <span>|</span>
        <span>개인정보처리방침</span>
        <span>|</span>
        <span>FAQ</span>
        <span>|</span>
        <span>제휴문의</span>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <SocialIcon
          href="https://instagram.com/goatlife"
          icon="/images/icons/icon-instagram.svg"
          alt="Instagram"
        />
        <SocialIcon
          href="https://x.com/goatlife"
          icon="/images/icons/icon-twitter.svg"
          alt="X (Twitter)"
        />
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  icon,
  alt,
}: {
  href: string;
  icon: string;
  alt: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-4 h-4 hover:opacity-80 transition-opacity"
    >
      <Image src={icon} alt={alt} width={16} height={16} />
    </a>
  );
}
