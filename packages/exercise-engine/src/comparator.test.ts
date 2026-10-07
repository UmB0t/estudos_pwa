import { describe, expect, it } from 'vitest';
import {
  areValuesEquivalent,
  canonicalRowKey,
  canonicalValueString,
  compareResultSets,
} from './comparator';

describe('comparator unit tests', () => {
  describe('areValuesEquivalent', () => {
    it('deve considerar nulos e undefined equivalentes', () => {
      expect(areValuesEquivalent(null, null)).toBe(true);
      expect(areValuesEquivalent(null, undefined)).toBe(true);
      expect(areValuesEquivalent(undefined, null)).toBe(true);
      expect(areValuesEquivalent(null, 'null')).toBe(false);
      expect(areValuesEquivalent(null, 0)).toBe(false);
    });

    it('deve considerar números e strings numéricas equivalentes', () => {
      expect(areValuesEquivalent(150, '150.00')).toBe(true);
      expect(areValuesEquivalent('150.0', 150)).toBe(true);
      expect(areValuesEquivalent(0, '0')).toBe(true);
      expect(areValuesEquivalent(42, 42)).toBe(true);
      expect(areValuesEquivalent(10, '11')).toBe(false);
    });

    it('deve considerar booleanos', () => {
      expect(areValuesEquivalent(true, true)).toBe(true);
      expect(areValuesEquivalent(false, false)).toBe(true);
      expect(areValuesEquivalent(true, false)).toBe(false);
    });

    it('deve considerar strings normais', () => {
      expect(areValuesEquivalent('São Paulo', 'São Paulo')).toBe(true);
      expect(areValuesEquivalent('São Paulo', 'Rio')).toBe(false);
    });
  });

  describe('canonicalValueString e canonicalRowKey', () => {
    it('deve normalizar valores numericos e nulos para chaves consistentes', () => {
      expect(canonicalValueString(150)).toBe('num:150.000000');
      expect(canonicalValueString('150.00')).toBe('num:150.000000');
      expect(canonicalValueString(null)).toBe('null');
      expect(canonicalValueString('abc')).toBe('str:abc');

      expect(canonicalRowKey([1, 'Ana', '150.00'])).toBe(
        'num:1.000000||str:Ana||num:150.000000',
      );
    });
  });

  describe('compareResultSets', () => {
    it('deve retornar correct para conjuntos idênticos', () => {
      const student = { columns: ['id', 'nome'], rows: [[1, 'Ana'], [2, 'Bob']] };
      const solution = { columns: ['id', 'nome'], rows: [[1, 'Ana'], [2, 'Bob']] };
      const res = compareResultSets(student, solution, true);
      expect(res.status).toBe('correct');
    });

    it('deve retornar almost para colunas em ordem diferente', () => {
      const student = { columns: ['nome', 'id'], rows: [['Ana', 1], ['Bob', 2]] };
      const solution = { columns: ['id', 'nome'], rows: [[1, 'Ana'], [2, 'Bob']] };
      const res = compareResultSets(student, solution, true);
      expect(res.status).toBe('almost');
      expect(res.message).toContain('ordem diferente');
    });

    it('deve retornar almost para coluna extra', () => {
      const student = {
        columns: ['id', 'nome', 'cidade'],
        rows: [[1, 'Ana', 'SP'], [2, 'Bob', 'RJ']],
      };
      const solution = {
        columns: ['id', 'nome'],
        rows: [[1, 'Ana'], [2, 'Bob']],
      };
      const res = compareResultSets(student, solution, true);
      expect(res.status).toBe('almost');
      expect(res.message).toContain('`cidade`');
    });
  });
});
