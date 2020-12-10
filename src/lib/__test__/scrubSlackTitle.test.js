import scrubSlackTitle from '../scrubSlackTitle';

describe('scrubSlackTitle tests', () => {
  it('Will return expected result', () => {
    const test = 'How to put a mask on <🌲🌲>?';
    const testres = 'How to put a mask on &lt;🌲🌲&gt;?';
    const result = scrubSlackTitle(test);
    expect(result).toBe(testres);
  });
  it('Will escape required values', () => {
    const test = `This <is> a & "crazy" 'example' for < this >`;
    const testres = `This &lt;is&gt; a &amp; "crazy" 'example' for &lt; this &gt;`;
    const result = scrubSlackTitle(test);
    expect(result).toBe(testres);
  });
  it(`Will not update ticks (')`, () => {
    const test = `This contains a '< tick '`;
    const testres = `This contains a '&lt; tick '`;
    const result = scrubSlackTitle(test);
    expect(result).toBe(testres);
  });
  it('Will not update quotes (")', () => {
    const test = `This contains a" < quote"`;
    const testres = `This contains a" &lt; quote"`;
    const result = scrubSlackTitle(test);
    expect(result).toBe(testres);
  });
});
