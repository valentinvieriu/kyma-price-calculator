import { ShellBar } from '@ui5/webcomponents-react';
import './Navbar.css';

export default function Navbar() {
  return (
    <ShellBar
      logo={<img alt="Kyma runtime logo" src="./kyma-logo.png" />}
      primaryTitle="Kyma runtime service on SAP platform"
      secondaryTitle="Cost Estimator"
    />
  );
}
