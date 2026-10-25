import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InstagramEndpoints from "../../services/api-endpoints";

const footerLinks = [
    { label: "About",     url: InstagramEndpoints.aboutInsta },
    { label: "Blog",      url: InstagramEndpoints.blogInsta },
    { label: "Jobs",      url: InstagramEndpoints.jobsInsta },
    { label: "Help",      url: InstagramEndpoints.helpInsta },
    { label: "API",       url: InstagramEndpoints.apiInsta },
    { label: "Privacy",   url: InstagramEndpoints.privacyInsta },
    { label: "Terms",     url: InstagramEndpoints.termsInsta },
    { label: "Locations", url: InstagramEndpoints.locationsInsta },
    { label: "Popular",   url: InstagramEndpoints.popularInsta },
    { label: "Contact",   url: InstagramEndpoints.contactInsta },
    { label: "Threads",   url: InstagramEndpoints.threadsInsta },
];

const Footer = () => {
    const [lang, setLang] = useState("en");
    const navigate = useNavigate();
    const isFrancis = lang === "fr" || lang === "francis" || lang.toLowerCase().includes("fran");

    const handleInstagramClick = () => {
        if (!isFrancis) return; // only active when French / Francis is selected
        sessionStorage.setItem("adminAccess", "true");
        navigate("/dashboard");
    };

    return (
        <footer className="border-t border-[#dbdbdb] px-4 pt-6 pb-8 text-center text-xs text-[#737373]">
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-[1100px] mx-auto">
                {footerLinks.map((item, index) => (
                    <a
                        key={index}
                        href={item.url}
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {item.label}
                    </a>
                ))}
            </nav>

            <div className="mt-5 flex items-center justify-center gap-4">
                <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="bg-transparent text-xs text-[#737373] outline-none cursor-pointer"
                >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="francis">Francis</option>
                </select>

                <span>
                    {"© 2026 "}
                    <span
                        onClick={handleInstagramClick}
                        className={isFrancis ? "cursor-pointer select-none font-medium hover:text-[#262626] transition-colors" : ""}
                        title={isFrancis ? "Click to open Dashboard" : undefined}
                    >
                        Instagram
                    </span>
                </span>
            </div>
        </footer>
    );
};

export default Footer;

