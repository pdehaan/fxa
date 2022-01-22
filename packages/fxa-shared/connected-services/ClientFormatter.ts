import { AttachedClient } from './models/AttachedClient';
import { IClientFormatter } from './IClientFormatter';
import { localizeTimestamp } from '../l10n/localizeTimestamp';

export class ClientFormatter implements IClientFormatter {
  constructor(
    private readonly bestLanguage: string,
    private readonly supportedLanguages: string[],
    private readonly defaultLanguage: string,
    private readonly earliestSaneAccessTime: number,
    private readonly logProvider: () => any,
    private readonly territoriesProvider: (language: string) => any
  ) {}

  public formatLocation(client: AttachedClient, acceptLanguage?: string) {
    const log = this.logProvider();

    let language;

    if (!client.location) {
      client.location = {};
    } else {
      const location = client.location;
      try {
        const language = this.bestLanguage;
        // For English, we can leave all the location components intact.
        // For other languages, only return what we can translate
        if (/^en/.test(language)) {
          client.location = {
            city: location.city,
            country: location.country,
            state: location.state,
            stateCode: location.stateCode,
          };
        } else {
          const territoriesLang =
            language === 'en-US' ? 'en-US-POSIX' : language;
          const territories = this.territoriesProvider(territoriesLang); // TODO: require(`cldr-localenames-full/main/${territoriesLang}/territories.json`);
          client.location = {
            country:
              territories.main[language].localeDisplayNames.territories[
                location.countryCode || ''
              ],
          };
        }
      } catch (err) {
        log.debug('attached-clients.formatLocation.warning', {
          err: err.message,
          languages: acceptLanguage,
          language,
          location,
        });
        client.location = {};
      }
    }
    return client;
  }

  public formatTimestamps(client: AttachedClient, acceptLanguage?: string) {
    const format = localizeTimestamp({
      supportedLanguages: this.supportedLanguages,
      defaultLanguage: this.defaultLanguage,
    }).format;

    if (client.createdTime) {
      client.createdTimeFormatted = format(client.createdTime, acceptLanguage);
    }
    if (client.lastAccessTime) {
      client.lastAccessTimeFormatted = format(
        client.lastAccessTime,
        acceptLanguage
      );
      if (client.lastAccessTime < this.earliestSaneAccessTime) {
        client.approximateLastAccessTime = this.earliestSaneAccessTime;
        client.approximateLastAccessTimeFormatted = format(
          this.earliestSaneAccessTime,
          acceptLanguage
        );
      }
    }
    return client;
  }
}
