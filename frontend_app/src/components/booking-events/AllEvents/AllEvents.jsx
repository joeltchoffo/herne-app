import React, {useEffect, useMemo, useState} from 'react';
import { useSearchParams } from 'react-router-dom'; // ⬅️ NEU
import ApiService from '../../../service/ApiService';
import Pagination from '../../common/Pagination';
import EventCard from '../../common/EventCard/EventCard';
import EventSearch from '../../common/EventSearch/EventSearch';
import styles from './AllEvents.module.css';

const STORAGE_KEY = 'AllEvents.filteredIds:v1'; // ⬅️ NEU

const AllEventsPage = () => {
  // ⬇️ NEU: URL-Query-Params
  const [sp, setSp] = useSearchParams();

  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  // ⬇️ NEU: page initial aus URL lesen
  const pageFromUrl = useMemo(() => {
    const p = parseInt(sp.get('page') || '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [sp]);

  // Backend beim ersten Laden alle Events abrufen
  useEffect(() => {
    ApiService.getAllEvents()
      .then(data => {
        const list = Array.isArray(data) ? data : (data.eventList || []);
        setAllEvents(list);

        // ⬇️ NEU: Versuche, gefilterte IDs aus sessionStorage wiederherzustellen
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const ids = new Set(JSON.parse(stored));
            const restored = list.filter(ev => ids.has(ev.id));
            if (restored.length > 0) {
              setFilteredEvents(restored);
              return; // nicht auf all setzen
            }
          } catch { /* ignore */ }
        }
        // Fallback: ungefiltert
        setFilteredEvents(list);
      })
      .catch(console.error);
  }, []);

  // ⬇️ NEU: currentPage an URL koppeln (lesen)
  useEffect(() => {
    setCurrentPage(pageFromUrl);
  }, [pageFromUrl]);

  // ⬇️ NEU: Helper, um page in URL zu schreiben (History-Eintrag → „Zurück“)
  const setPageInUrl = (page) => {
    const next = new URLSearchParams(sp);
    if (!page || page === 1) next.delete('page'); else next.set('page', String(page));
    setSp(next); // push state
  };

  // Funktion zur Aktualisierung der Suchergebnisse
  const handleSearchResult = (results) => {
    setFilteredEvents(results);
    setCurrentPage(1);
    setPageInUrl(1); // ⬅️ NEU: beim neuen Filter auf Seite 1 & URL updaten

    // ⬇️ NEU: IDs für „Zurück“-Wiederherstellung puffern (keine Änderungen an EventSearch nötig)
    try {
      const ids = Array.isArray(results) ? results.map(ev => ev.id) : [];
      if (ids.length > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
  };

  // Pagination-Berechnungen
  const lastIdx = currentPage * eventsPerPage;
  const firstIdx = lastIdx - eventsPerPage;
  const currentEvents = filteredEvents.slice(firstIdx, lastIdx);

  // ⬇️ NEU: Wrapper um paginate, der zusätzlich die URL pflegt
  const handlePaginate = (page) => {
    setCurrentPage(page);
    setPageInUrl(page);
  };

  return (
    <div className={styles.allEventsPage}>
      <div className={styles.titleBlock}>
        <h2 className={styles.title}>Veranstaltungen</h2>
      </div>

      <div className={styles.controls}>
        {/* Unverändert: EventSearch verwaltet weiterhin seine UI-Filter intern */}
        <EventSearch
          inline
          events={allEvents}
          handleSearchResult={handleSearchResult}
        />
      </div>

      <div className={styles.eventGrid}>
        {currentEvents.map((ev, idx) => (
          <div
            key={ev.id}
            className={styles.cardWrapper}
            style={{animationDelay: `${idx * 100}ms`}}
          >
            <EventCard event={ev}/>
          </div>
        ))}
      </div>

      <div className={styles.paginationWrapper}>
        {filteredEvents.length > 0 && (
          <Pagination
            itemsPerPage={eventsPerPage}
            totalItems={filteredEvents.length}
            currentPage={currentPage}
            paginate={handlePaginate}
          />
        )}
      </div>
    </div>
  );
};

export default AllEventsPage;
