import NodePoolsSection from './NodePoolsSection';
import StorageSection from './StorageSection';
import ServicesSection from './ServicesSection';

export default function Configurator() {
  return (
    <>
      <NodePoolsSection />
      <StorageSection />
      <ServicesSection />
    </>
  );
}
