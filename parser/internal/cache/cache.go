package cache

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"fmt"

	_ "modernc.org/sqlite"

	"parser/config"
)

type Cache struct {
	db *sql.DB
}

func New(path string) (*Cache, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS cache (
		hash       TEXT PRIMARY KEY,
		result     TEXT NOT NULL,
		created_at DATETIME DEFAULT (datetime('now'))
	)`)
	if err != nil {
		return nil, err
	}
	return &Cache{db: db}, nil
}

func (c *Cache) Close() error {
	return c.db.Close()
}

// Key returns the cache key for a given file or text payload.
// It is sha256(data) + ":" + schemaVersion.
func Key(data []byte) string {
	sum := sha256.Sum256(data)
	return fmt.Sprintf("%x:%s", sum, config.CacheSchemaVersion)
}

// Get retrieves a cached result into dst. Returns (true, nil) on hit.
func (c *Cache) Get(key string, dst any) (bool, error) {
	var raw string
	err := c.db.QueryRow("SELECT result FROM cache WHERE hash = ?", key).Scan(&raw)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, json.Unmarshal([]byte(raw), dst)
}

// Set stores a result in the cache, replacing any existing entry for the same key.
func (c *Cache) Set(key string, value any) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	_, err = c.db.Exec(
		"INSERT OR REPLACE INTO cache (hash, result) VALUES (?, ?)",
		key, string(data),
	)
	return err
}
