import ContactContent from '@/components/ContactContent';
import DeliveryInfo from '@/components/DeliveryInfo';

export default function ContactsPage() {
  return <><section className="wrapper section page-section stack">
    <h1 className="page-title">Контакты</h1>
    <ContactContent />
  </section><DeliveryInfo /></>;
}
