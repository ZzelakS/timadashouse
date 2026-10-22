import { Link } from "react-router-dom";
import { imagePolicies } from "../data/policies";
import { pmuDocuments } from "../data/pmuCare";

export function PolicyContent() {
  return (
    <>
      <h1>OUR POLICIES.</h1>
      {imagePolicies.map((policy) => (
        <details key={policy.title}>
          <summary>{policy.title}</summary>
          <p style={{ whiteSpace: "pre-line" }}>{policy.text}</p>
        </details>
      ))}
      <p>
        <Link className="text-link" to="/pmu-care">
          PMU preparation, consent and aftercare
        </Link>
      </p>
    </>
  );
}

export function PMUContent() {
  return (
    <>
      <h1>PMU care & FAQ.</h1>
      {pmuDocuments.map((document, index) => (
        <section key={index}>
          <h2>{document.title}</h2>
          {document.text.split("\n\n").map((paragraph, i) => (
            <p key={i} style={{ whiteSpace: "pre-line" }}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <p>
        <Link to="/policies" className="text-link">
          OUR POLICIES.
        </Link>
      </p>
    </>
  );
}
