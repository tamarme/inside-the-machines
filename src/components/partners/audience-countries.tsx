import {
  countryName,
  totalFollowersForCountryShares,
  type CountryFollowers,
  type PlatformSnapshot,
} from "@/lib/audience/contract";

const numberFormat = new Intl.NumberFormat("en-GB");
const percentFormat = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const leadCountryCount = 5;

function CountryRows({ countries, totalFollowers, start }: {
  countries: CountryFollowers[];
  totalFollowers: number | undefined;
  start?: number;
}) {
  return (
    <ol role="list" start={start}>
      {countries.map(({ countryCode, followers }) => {
        const share = totalFollowers ? followers / totalFollowers : undefined;
        const count = numberFormat.format(followers);

        return (
          <li key={countryCode}>
            <span>{countryName(countryCode)}</span>
            <span className="country-followers">
              {share === undefined ? count : (
                <>
                  {share < 0.001 ? `<${percentFormat.format(0.001)}` : percentFormat.format(share)}{" "}
                  <small>({count})</small>
                </>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AudienceCountries({ snapshot }: { snapshot: PlatformSnapshot }) {
  const countries = snapshot.countryFollowers;
  if (!countries?.length) return null;

  const totalFollowers = totalFollowersForCountryShares(snapshot);
  const remainingCountries = countries.slice(leadCountryCount);

  return (
    <section className="audience-countries">
      <h4>Followers by country</h4>
      <p>{totalFollowers ? "Share of total followers" : "Latest follower demographics"}</p>
      <CountryRows countries={countries.slice(0, leadCountryCount)} totalFollowers={totalFollowers} />
      {remainingCountries.length > 0 && (
        <details>
          <summary>More countries ({remainingCountries.length})</summary>
          <CountryRows countries={remainingCountries} totalFollowers={totalFollowers} start={leadCountryCount + 1} />
        </details>
      )}
    </section>
  );
}
