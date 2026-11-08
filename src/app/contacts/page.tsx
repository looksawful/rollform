import ContactContent from '@/components/ContactContent';
import DeliveryInfo from '@/components/DeliveryInfo';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ContactsPage() {
  return <><section className="wrapper section page-section stack">
    <Breadcrumbs current="Контакты" />
    <h1 className="page-title">Контакты</h1>
    <ContactContent />
  </section><DeliveryInfo /></>;
}
