# Sequencer Parameters for RC0 MEMORY files

all FX that have a param with fxSeqTarget = true have a sequencer.


Example from the LPF sequencer config:
```xml
<AA_LPF_SEQ>
	<A>1</A> // SW: OFF_ON = ON
	<B>1</B> // SYNC: OFF_ON = ON
	<C>1</C> // RETRIG: OFF_ON = ON
	<D>1</D> // TARGET: ENUM (seq target params) = (2nd seq target param; at index 1 of seq target params for FX)
	<E>15</E> // SEQ RATE: 4MEAS, 2MEAS, 1MEAS, note values, 0-100 (like STEP RATE, with no OFF value at index 0); xml value of 14 is value "0"
	<F>7</F> // SEQ MAX: set of int 1-16; 7 is an index pointing at value "8"
	<G>8</G> // <G-V>: seq value N - value for step 1-16
	<H>2</H> 
	<I>4</I>
	<J>2</J>
	<K>0</K>
	<L>0</L>
	<M>0</M>
	<N>0</N>
	<O>0</O>
	<P>0</P>
	<Q>0</Q>
	<R>0</R>
	<S>0</S>
	<T>0</T>
	<U>0</U>
	<V>0</V>
</AA_LPF_SEQ>
```