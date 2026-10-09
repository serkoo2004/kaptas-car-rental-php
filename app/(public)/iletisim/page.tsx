import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactCards = [
  {
    icon: Phone,
    label: "Telefon",
    value: "+90 462 000 00 00",
    text: "Arac uygunlugu ve rezervasyon icin arayin.",
  },
  {
    icon: MapPin,
    label: "Bolge",
    value: "Teslimat noktasi",
    text: "Arac teslimi ve iadesi ana operasyon noktasinda yapilir.",
  },
  {
    icon: Clock,
    label: "Saat",
    value: "09:00 - 19:00",
    text: "Hafta ici ve cumartesi hizli donus.",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-red-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <div className="mb-5 flex items-center gap-3 text-sm font-semibold text-red-600">
              <span className="h-px w-10 bg-red-500" />
              <span>Arac kiralama iletisim</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-primary sm:text-5xl">
              Arac uygunlugu ve teslim detaylari icin bize ulasin.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/66">
              Arac ihtiyacinizi, teslim noktasini ve tarih bilgisini iletin;
              uygun arac ve teslim alternatifiyle donus yapalim.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <Mail className="h-5 w-5 text-accent" />
            <h2 className="mt-4 text-lg font-semibold text-primary">
              Hizli mesaj
            </h2>
            <form
              action="mailto:info@arackiralama.local"
              className="mt-5 grid gap-4"
              encType="text/plain"
              method="post"
            >
              <Input name="name" placeholder="Ad soyad" />
              <Input name="phone" placeholder="Telefon" />
              <Input name="date" placeholder="Tarih / teslim noktasi" />
              <Textarea
                name="message"
                placeholder="Arac tipi, gun sayisi ve varsa ozel talebiniz"
              />
              <Button className="bg-accent hover:bg-accent/90" type="submit">
                Mesaj bilgilerini hazirla
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {contactCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="rounded-lg border border-red-200 bg-white p-6 shadow-sm"
              key={item.label}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-100 text-cyan-700">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold text-red-600">
                {item.label}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-primary">
                {item.value}
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground/62">
                {item.text}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
