import { useAtom } from 'jotai';
import ResultStatistics from '../ResultStatistics/ResultStatistics';
import './SideContent.css';
import { timeConsumptionState } from '../../state/additionalConfig/timeConsumptionState';
import SpinnerInput from '../CostWizard/UserInputs/common/SpinnerInput';
import config from '../../config.json';

export default function SideContent() {
  const [timeConsumption, setTimeConsumption] = useAtom(timeConsumptionState);

  return (
    <div id="SideContent">
      <h1 id="SideHeader">Resulting total costs</h1>
      <div id="SideHeader2">
        <span className="side-month-label">per month ≈</span>
        <SpinnerInput
          value={timeConsumption}
          setValue={setTimeConsumption}
          min={config.TimeConsumption.Min}
          max={config.TimeConsumption.Max}
          step={config.TimeConsumption.Step}
        />
        <span className="side-month-label">hrs.</span>
      </div>
      <ResultStatistics />
    </div>
  );
}
