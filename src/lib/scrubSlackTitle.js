export default function scrubSlackTitle(html) {
  // reference: https://api.slack.com/reference/surfaces/formatting#escaping
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
